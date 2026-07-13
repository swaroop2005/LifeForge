import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Donor, BloodStock, BloodJourney, Donation

_CSV_PATH = Path(__file__).parent.parent.parent / "data" / "eraktkosh_stock.csv"
_df_cache = None

def _get_df():
    global _df_cache
    if _df_cache is None:
        import pandas as pd
        _df_cache = pd.read_csv(_CSV_PATH, dtype=str)
        _df_cache["availability"] = pd.to_numeric(_df_cache["availability"], errors="coerce").fillna(0).astype(int)
    return _df_cache

BLOOD_COMPAT = {
    "O+":  {"can_receive": ["O+", "O-"], "can_donate_to": ["O+", "A+", "B+", "AB+"]},
    "O-":  {"can_receive": ["O-"], "can_donate_to": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]},
    "A+":  {"can_receive": ["A+", "A-", "O+", "O-"], "can_donate_to": ["A+", "AB+"]},
    "A-":  {"can_receive": ["A-", "O-"], "can_donate_to": ["A+", "A-", "AB+", "AB-"]},
    "B+":  {"can_receive": ["B+", "B-", "O+", "O-"], "can_donate_to": ["B+", "AB+"]},
    "B-":  {"can_receive": ["B-", "O-"], "can_donate_to": ["B+", "B-", "AB+", "AB-"]},
    "AB+": {"can_receive": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "can_donate_to": ["AB+"]},
    "AB-": {"can_receive": ["A-", "B-", "AB-", "O-"], "can_donate_to": ["AB+", "AB-"]},
}

MCP_TOOLS = [
    {"type": "function", "function": {
        "name": "check_donor_eligibility",
        "description": "Check if a blood donor is eligible to donate based on their last donation date. 90-day gap required between donations.",
        "parameters": {"type": "object", "properties": {"donor_id": {"type": "string", "description": "The donor's ID"}}, "required": ["donor_id"]}
    }},
    {"type": "function", "function": {
        "name": "check_blood_compatibility",
        "description": "Check blood type compatibility — which blood types a person can receive from and donate to.",
        "parameters": {"type": "object", "properties": {"blood_type": {"type": "string", "description": "Blood type e.g. O+, AB-, B+"}}, "required": ["blood_type"]}
    }},
    {"type": "function", "function": {
        "name": "get_shortage_alerts",
        "description": "Get real-time blood shortage alerts for a city or region.",
        "parameters": {"type": "object", "properties": {"region": {"type": "string", "description": "City or region name"}}, "required": ["region"]}
    }},
    {"type": "function", "function": {
        "name": "get_donor_impact",
        "description": "Get stats on how many patients a donor's blood has helped.",
        "parameters": {"type": "object", "properties": {"donor_id": {"type": "string"}}, "required": ["donor_id"]}
    }},
    {"type": "function", "function": {
        "name": "find_blood_banks",
        "description": "Search real national blood bank stock data from eRaktKosh (4443 hospitals across India) to find hospitals that have a specific blood type and/or blood component available. Use when patient asks where to find blood, which hospital has their blood type, or blood availability near a city/state.",
        "parameters": {"type": "object", "properties": {
            "blood_group": {"type": "string", "description": "Blood group e.g. O+, A-, B+, AB+"},
            "state": {"type": "string", "description": "Indian state name e.g. Karnataka, Delhi, Maharashtra"},
            "component": {"type": "string", "description": "Blood component e.g. Packed Red Blood Cells, Whole Blood, Platelets, Fresh Frozen Plasma. Default to Packed Red Blood Cells for thalassemia/anemia patients."}
        }, "required": ["blood_group"]}
    }},
]

SYSTEM_PROMPT = {
    "en": """You are VitaTrace Assistant — a warm, knowledgeable health companion for people dealing with blood disorders. You help patients, donors, and caregivers.

You are an expert in:
- **Thalassemia** (major & minor): transfusion schedules, chelation therapy, diet, fatigue management, genetic counseling
- **Sickle Cell Disease**: pain crisis management, hydration, diet, avoid triggers, hydroxyurea info
- **Hemophilia A & B**: bleeding precautions, factor replacement, joint protection, safe activities
- **Iron Deficiency Anemia**: diet, iron-rich foods, absorption tips, cooking in iron pans
- **Aplastic Anemia**: lifestyle, infection prevention, treatment options
- **Blood donation**: eligibility (age 18-65, weight >50kg, hemoglobin >12.5g/dL, 90-day gap), process, aftercare
- **Blood compatibility**: ABO and Rh typing, universal donors/recipients

Your personality:
- Warm, empathetic, and encouraging — like a knowledgeable friend
- Use simple language, avoid jargon unless the user seems medical
- Be concise but complete — bullet points help for lists
- Always remind users to consult their doctor for personal medical decisions
- Never be dismissive of symptoms — take concerns seriously
- For supplement and diet questions, give specific, actionable answers using the knowledge provided — do NOT deflect to "consult a doctor" for basic nutritional guidance (always add "discuss with your haematologist before starting new supplements" at the end, but give the actual answer first)

If asked about something outside blood disorders or general health, politely say you specialise in blood disorder support.""",

    "hi": """आप VitaTrace सहायक हैं — रक्त विकारों से जूझ रहे लोगों के लिए एक गर्मजोशी से भरे, जानकार स्वास्थ्य साथी। आप मरीजों, दाताओं और देखभाल करने वालों की मदद करते हैं।

आप इन विषयों के विशेषज्ञ हैं:
- थैलेसीमिया: रक्त आधान, आहार, थकान प्रबंधन
- सिकल सेल रोग: दर्द प्रबंधन, जलयोजन, आहार
- हीमोफीलिया: रक्तस्राव सावधानियां, जोड़ों की सुरक्षा
- आयरन की कमी से एनीमिया: आहार, आयरन युक्त खाद्य पदार्थ
- रक्तदान: पात्रता, प्रक्रिया, देखभाल
- रक्त संगतता

हमेशा हिंदी में उत्तर दें। गर्मजोशी से और सरल भाषा में बात करें।""",

    "te": """IMPORTANT INSTRUCTION: You MUST respond ONLY in Telugu language. Do NOT use Japanese, Chinese, or any other language. Only Telugu script.

మీరు VitaTrace సహాయకుడు — రక్త రుగ్మతలతో పోరాడుతున్న వ్యక్తులకు స్నేహపూర్వకంగా సహాయపడే ఆరోగ్య సహచరుడు. మీరు రోగులకు, దాతలకు మరియు సంరక్షకులకు సహాయపడతారు.

మీకు ఈ విషయాలలో నైపుణ్యం ఉంది:
- థలసేమియా: రక్త మార్పిడి, ఆహారం, అలసట నిర్వహణ, జన్యు సలహా
- సికిల్ సెల్ వ్యాధి: నొప్పి నిర్వహణ, నీటి పుష్కలత, ఆహారం, ట్రిగ్గర్లు నివారించడం
- హిమోఫిలియా: రక్తస్రావం జాగ్రత్తలు, కీళ్ళ రక్షణ, సురక్షిత కార్యకలాపాలు
- ఇనుప లోపం రక్తహీనత: ఆహారం, ఇనుము అధికంగా ఉన్న ఆహారాలు
- రక్తదానం: అర్హత, ప్రక్రియ, తర్వాత సంరక్షణ
- రక్త అనుకూలత: ABO మరియు Rh రకాలు

మీ వ్యక్తిత్వం: స్నేహపూర్వకంగా, సానుభూతితో మరియు సరళమైన తెలుగులో మాట్లాడండి.

REMINDER: Always answer in Telugu only. తెలుగులో మాత్రమే సమాధానం ఇవ్వండి."""
}

DISEASE_RULES = {
    "thalassemia": """This patient has THALASSEMIA. Critical rules you MUST always follow:
1. IRON: Thalassemia patients have IRON OVERLOAD from transfusions. They must AVOID iron-rich foods (red meat, liver, spinach, iron supplements). NEVER recommend iron supplementation unless ferritin is confirmed very low by their doctor.
2. FOLIC ACID: Must take 5mg folic acid daily (not 400mcg — the full 5mg therapeutic dose) due to high cell turnover.
3. CHELATION: Patients on deferoxamine or deferasirox need zinc 15-25mg/day and calcium + vitamin D supplementation.
4. CALCIUM + VITAMIN D: Essential for bone protection. 1000-1200mg calcium and 800-1000 IU vitamin D daily.
5. VITAMIN C: Small food amounts (1-2 fruits/day) are safe. Supplements >200mg DANGEROUS with iron overload.
6. Sources: NIH ODS confirms these guidelines.""",

    "sickle_cell": """This patient has SICKLE CELL DISEASE. Critical rules you MUST always follow:
1. HYDRATION: Dehydration is the #1 crisis trigger. Must drink 8-10 glasses (2-2.5L) daily minimum.
2. FOLIC ACID: Must take 5mg folic acid daily (high dose) due to accelerated red cell destruction.
3. IRON: Patients NOT on transfusions have normal iron levels — eat normally. Patients ON regular transfusions may have iron overload — check ferritin before recommending iron foods.
4. ZINC: Zinc deficiency very common (40-60% of patients). 25mg zinc sulphate 3x/day may reduce crises.
5. VITAMIN D: Check and supplement to >30 ng/mL. 4000 IU/day may reduce pain crisis frequency.
6. OMEGA-3: Anti-inflammatory. Fish 2-3x/week or fish oil supplements beneficial.
7. TRIGGERS TO AVOID: Cold temperatures, dehydration, altitude, strenuous exercise, alcohol.
8. Sources: NIH ODS and clinical trials support these recommendations.""",

    "hemophilia": """This patient has HEMOPHILIA. Critical rules you MUST always follow:
1. VITAMIN K: Vitamin K supplements DO NOT treat hemophilia (factors VIII/IX are not vitamin K-dependent). However if on warfarin, consistent vitamin K intake is critical — do not suddenly change leafy green consumption.
2. IRON: Monitor for iron deficiency anemia due to chronic bleeding losses. Annual ferritin check recommended.
3. JOINTS: High calcium + vitamin D protects bones and joints damaged by bleeds.
4. AVOID: Aspirin, NSAIDs (ibuprofen, diclofenac) — worsen bleeding and impair iron absorption.
5. SAFE: Low-impact exercise (swimming, walking), protective gear for any physical activity.
6. Sources: NIH ODS guidelines.""",

    "iron_deficiency_anemia": """This patient has IRON DEFICIENCY ANEMIA. Critical rules you MUST always follow:
1. IRON-RICH FOODS: Actively recommend — red meat, chicken, fish, lentils, tofu, dark leafy greens, moringa.
2. VITAMIN C: Essential with every iron-rich meal to increase absorption by 67%. Amla is best Indian source.
3. CALCIUM TIMING: NEVER take iron with dairy/calcium — separates by 2 hours minimum. Most common reason iron treatment fails in India.
4. TEA/COFFEE: Avoid within 1 hour of iron-rich meals — polyphenols block iron absorption.
5. FOLIC ACID + B12: Check for co-deficiency — very common in India, requires both supplements.
6. COPPER: If iron treatment fails after 3 months, suggest testing serum copper (copper deficiency mimics iron deficiency anemia).
7. Sources: NIH ODS.""",

    "aplastic_anemia": """This patient has APLASTIC ANEMIA. Critical rules:
1. INFECTION PREVENTION: Compromised immunity — avoid crowded places, wash hands frequently.
2. IRON: Transfusion-dependent patients develop iron overload — avoid iron supplements.
3. NUTRITION: Anti-inflammatory, antioxidant-rich diet supports remaining bone marrow function.
4. Sources: Medical guidelines.""",
}

def _disease_rules(disease: str) -> str:
    if not disease:
        return ""
    d = disease.lower().replace(" ", "_").replace("-", "_")
    for key, rules in DISEASE_RULES.items():
        if key in d or d in key:
            return rules
    return ""


def execute_tool(name: str, args: dict, db: Session) -> str:
    if name == "check_donor_eligibility":
        donor = db.query(Donor).filter(Donor.id == args["donor_id"]).first()
        if not donor:
            return "Donor not found in the system."
        if not donor.last_donation_date:
            return "This donor is eligible to donate — no previous donation recorded."
        days = (datetime.utcnow() - donor.last_donation_date).days
        if days >= 90:
            return f"Eligible to donate. Last donation was {days} days ago (well past the 90-day minimum)."
        return f"Not yet eligible. Last donation was {days} days ago. Must wait {90 - days} more days."

    if name == "check_blood_compatibility":
        # Handle input like "O+ and AB+" or just "O+"
        raw = args.get("blood_type", "")
        results = []
        for bt in ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]:
            if bt in raw:
                c = BLOOD_COMPAT[bt]
                results.append(f"{bt}: can receive from {', '.join(c['can_receive'])} | can donate to {', '.join(c['can_donate_to'])}")
        if not results:
            return f"Could not parse blood type from '{raw}'. Please specify like O+, AB-, B+, etc."
        return "\n".join(results)

    if name == "get_shortage_alerts":
        region = args.get("region", "")
        low_stocks = db.query(BloodStock).all()
        critical = []
        for s in low_stocks:
            if s.units < 10:
                try:
                    bank_city = s.bank.city if s.bank else ""
                    if not region or bank_city.lower() == region.lower():
                        critical.append(f"{s.blood_type} at {s.bank.name if s.bank else 'Unknown'} ({s.units} units left)")
                except Exception:
                    pass
        if not critical:
            return f"No critical shortages detected{' in ' + region if region else ''}. All blood banks are adequately stocked."
        return "Critical shortages: " + "; ".join(critical)

    if name == "get_donor_impact":
        donor_id = args.get("donor_id", "")
        journey_count = db.query(BloodJourney).filter(BloodJourney.donor_id == donor_id).count()
        donation_count = db.query(Donation).filter(Donation.donor_id == donor_id).count()
        if donation_count == 0:
            return "No donations recorded yet for this donor."
        return f"This donor has made {donation_count} donation(s) that have reached {journey_count} patient(s). Every donation matters!"

    if name == "find_blood_banks":
        blood_group = args.get("blood_group", "")
        state = args.get("state", "")
        component = args.get("component", "")
        try:
            df = _get_df().copy()
            df = df[df["availability"] > 0]
            if blood_group:
                df = df[df["blood_group"].str.upper() == blood_group.upper()]
            if state:
                df = df[df["state"].str.lower().str.contains(state.lower(), na=False)]
            if component:
                df = df[df["component"].str.lower().str.contains(component.lower(), na=False)]
            df = df.sort_values("availability", ascending=False).head(5)
            if df.empty:
                return f"No blood banks found with {blood_group} available{' in ' + state if state else ''}."
            lines = [f"Top hospitals with {blood_group}{' (' + component + ')' if component else ''}{' in ' + state if state else ''}:"]
            for _, row in df.iterrows():
                lines.append(f"- {row['hospital_name']}, {row['district']}, {row['state']} — {row['availability']} units ({row['component']}) | Updated: {row['last_updated']}")
            return "\n".join(lines)
        except Exception as e:
            return f"Error searching blood banks: {e}"

    return "Tool not available."


def chat(message: str, language: str, user_id, db: Session,
         history: list = None, disease_filter: str = None, donor_id: str = None) -> str:
    try:
        from app.services.greenpt import retrieve_chunks, rerank_chunks, get_greenpt_client
        client = get_greenpt_client()
        # disease-aware retrieval: boost chunks matching patient's disease
        chunks = retrieve_chunks(message, top_k=20, disease_filter=disease_filter)
        top_chunks = rerank_chunks(message, chunks, top_k=5)
        # build context with source attribution
        context_parts = []
        for c in top_chunks:
            src = c.get("source", "VitaTrace")
            nutrient = c.get("nutrient")
            label = f"[{src}" + (f" — {nutrient}" if nutrient else "") + "]"
            context_parts.append(f"{label}\n{c['text']}")
        context = "\n\n".join(context_parts) if context_parts else ""
    except Exception:
        context = ""
        from app.services.greenpt import get_greenpt_client
        client = get_greenpt_client()

    lang = language if language in SYSTEM_PROMPT else "en"
    sys_content = SYSTEM_PROMPT[lang]

    # inject disease-specific critical rules so model NEVER gives wrong advice
    if disease_filter:
        disease_rules = _disease_rules(disease_filter)
        if disease_rules:
            sys_content += f"\n\n--- PATIENT-SPECIFIC RULES (ALWAYS FOLLOW) ---\n{disease_rules}"

    if donor_id:
        sys_content += f"\n\n--- CURRENT USER CONTEXT ---\nThe logged-in user is a donor. Their donor_id is: {donor_id}\nWhen calling check_donor_eligibility or get_donor_impact, use this donor_id automatically — do NOT ask the user for it."

    if context:
        sys_content += f"\n\n--- Verified knowledge from NIH ODS and VitaTrace (cite source when relevant) ---\n{context}"

    # green-l-raw supports custom system prompts
    messages = [{"role": "system", "content": sys_content}]

    if history:
        for h in history[-6:]:
            messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": message})

    resp = client.chat.completions.create(
        model="green-l-raw",
        messages=messages,
        tools=MCP_TOOLS,
        tool_choice="auto",
        max_tokens=600,
        temperature=0.7,
    )
    msg = resp.choices[0].message

    if msg.tool_calls:
        tool_results = []
        for tc in msg.tool_calls:
            try:
                args = json.loads(tc.function.arguments)
            except Exception:
                args = {}
            result = execute_tool(tc.function.name, args, db)
            tool_results.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result
            })

        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in msg.tool_calls
            ]
        })
        messages.extend(tool_results)

        resp2 = client.chat.completions.create(
            model="green-l-raw",
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        return resp2.choices[0].message.content or "I couldn't generate a response. Please try again."

    return msg.content or "I couldn't generate a response. Please try again."
