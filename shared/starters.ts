const initialStarters = [
  {
    id: "machine-learning",
    category: "Technology",
    title: "Build my first machine learning project",
    description:
      "Turn a real dataset into a small, explainable prediction project.",
    icon: "code",
    time: "3–5 hours / week",
    tags: ["Python", "Data", "Machine learning"],
    skills: [
      {
        key: "data-exploration",
        name: "Understand your data",
        definition:
          "Inspect a dataset and explain what a row, feature and target represent.",
        relevance:
          "Reliable predictions start with understanding what you measure.",
        prerequisites: [],
        standards: [
          "Describe the source, target and limitations",
          "Identify missing values and potential leakage",
        ],
        basis: "Learner-selected starter; no assessed evidence.",
        next_practice: "Inspect a small public dataset and write a data note.",
      },
      {
        key: "baseline-model",
        name: "Build a useful baseline",
        definition:
          "Create a simple predictor with a separated training and validation set.",
        relevance:
          "A baseline makes progress measurable and mistakes easier to find.",
        prerequisites: ["data-exploration"],
        standards: [
          "Separate training and held-out observations",
          "Compare a simple baseline to a learned model",
        ],
        basis: "Learner-selected starter; no assessed evidence.",
        next_practice: "Train a simple model and explain the split.",
      },
      {
        key: "model-judgment",
        name: "Evaluate and explain",
        definition:
          "Interpret model errors and identify when predictions should not be trusted.",
        relevance:
          "A model is useful only when you can explain its reliability.",
        prerequisites: ["baseline-model"],
        standards: [
          "Choose and justify a metric",
          "Explain failure cases and a limitation",
        ],
        basis: "Learner-selected starter; no assessed evidence.",
        next_practice: "Compare error patterns and propose one improvement.",
      },
    ],
    task: {
      title: "Meet your dataset",
      context:
        "Before making a prediction, build a clear picture of the data you will use. Choose a small public dataset you find interesting.",
      deliverable:
        "A short data brief: the question you want to answer, the source, five sample observations, missing values, target/feature definitions, and two limitations.",
      skill_keys: ["data-exploration"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 45,
      materials: [
        {
          title: "UCI Machine Learning Repository",
          url: "https://archive.ics.uci.edu/",
          source:
            "UC Irvine; choose a dataset and record its dataset-specific license.",
        },
      ],
      criteria: [
        {
          id: "data",
          description: "Describe what each observation and the target mean.",
          evidence_required: "A concrete example with named columns.",
        },
        {
          id: "judgment",
          description: "Identify a data limitation and explain why it matters.",
          evidence_required:
            "A specific limitation connected to your question.",
        },
      ],
      submission_kind: "mixed",
      help_rules:
        "Use resources and ask for guidance. Record the help you use.",
      independence: "guided",
      starting_point:
        "Pick one dataset you care about. Read its source documentation before opening a notebook.",
      dimensions: {
        complexity: "One dataset and one question",
        support: "Guided",
        unfamiliarity: "Choose a familiar topic",
        synthesis: "Data and interpretation",
        autonomy: "Choose and justify your question",
      },
    },
  },
  {
    id: "photography",
    category: "Creative",
    title: "Tell better stories through photography",
    description:
      "Make intentional photographs with the camera you already own.",
    icon: "camera",
    time: "2–3 hours / week",
    tags: ["Photography", "Composition", "Visual storytelling"],
    skills: [
      {
        key: "visual-intent",
        name: "Choose a visual intention",
        definition:
          "State what a photograph should communicate and choose a clear subject.",
        relevance: "Your intention gives technical decisions a purpose.",
        prerequisites: [],
        standards: [
          "Name the intended feeling or idea",
          "Explain the choice of subject",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Photograph one subject with two different intentions.",
      },
      {
        key: "composition",
        name: "Compose with purpose",
        definition: "Use framing, distance and viewpoint to guide attention.",
        relevance: "Composition helps a viewer see the story you intend.",
        prerequisites: ["visual-intent"],
        standards: [
          "Compare two frames of the same subject",
          "Explain a framing choice and its tradeoff",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Create three different compositions of a simple scene.",
      },
      {
        key: "photo-editing",
        name: "Select and reflect",
        definition:
          "Select a small coherent sequence and explain what works and what to improve.",
        relevance:
          "Reflection turns taking pictures into intentional practice.",
        prerequisites: ["composition"],
        standards: [
          "Select a consistent three-image story",
          "Explain an improvement with visible evidence",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Make a three-image story and write a short reflection.",
      },
    ],
    task: {
      title: "One subject, three perspectives",
      context:
        "A camera is a tool for making choices. Use your phone or camera to explore how a single subject changes when you change the frame.",
      deliverable:
        "Three photographs of one subject from different viewpoints, with a 150-word reflection on what each frame communicates. Submit image files and a written explanation.",
      skill_keys: ["visual-intent", "composition"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 40,
      materials: [],
      criteria: [
        {
          id: "intent",
          description: "Describe a clear visual intention.",
          evidence_required: "A specific statement tied to your subject.",
        },
        {
          id: "choices",
          description: "Compare the effect of two framing choices.",
          evidence_required:
            "Refer to named photographs and explain how the choices differ.",
        },
      ],
      submission_kind: "files",
      help_rules:
        "Guidance and examples are welcome; make your own photographs.",
      independence: "guided",
      starting_point:
        "Choose one everyday subject and make the first photograph at eye level.",
      dimensions: {
        complexity: "One subject",
        support: "Guided",
        unfamiliarity: "A familiar place",
        synthesis: "Framing and intention",
        autonomy: "Your subject and story",
      },
    },
  },
  {
    id: "public-speaking",
    category: "Communication",
    title: "Speak with more clarity and confidence",
    description: "Shape a message people can understand, remember and act on.",
    icon: "mic",
    time: "2 hours / week",
    tags: ["Speaking", "Storytelling", "Communication"],
    skills: [
      {
        key: "audience-purpose",
        name: "Know your audience",
        definition:
          "Define who you are speaking to and what they should understand or do.",
        relevance: "A message works when it meets a real audience need.",
        prerequisites: [],
        standards: [
          "Describe a specific audience",
          "State one intended takeaway",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Write a one-sentence takeaway for a real audience.",
      },
      {
        key: "message-structure",
        name: "Structure a clear message",
        definition:
          "Connect an opening, supporting points and a concrete close.",
        relevance: "Structure makes your ideas easier to follow.",
        prerequisites: ["audience-purpose"],
        standards: [
          "Use a clear opening and close",
          "Support the central claim with a concrete example",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Outline a two-minute talk with one example.",
      },
      {
        key: "delivery-reflection",
        name: "Practice and refine",
        definition:
          "Use recording and audience feedback to improve clarity and delivery.",
        relevance: "Practice reveals what a written outline cannot.",
        prerequisites: ["message-structure"],
        standards: [
          "Reflect on a recording or real audience feedback",
          "Explain a specific revision",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Record a talk and make one purposeful revision.",
      },
    ],
    task: {
      title: "Make one idea easy to understand",
      context:
        "Choose something you care about and explain it to a specific person who knows less about it than you do.",
      deliverable:
        "A 200–300 word script for a two-minute talk, plus your audience, one takeaway, and why you chose your example. Optional recording links can supplement the script.",
      skill_keys: ["audience-purpose", "message-structure"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 30,
      materials: [],
      criteria: [
        {
          id: "audience",
          description: "Make the audience and intended takeaway specific.",
          evidence_required: "An explicit audience description and takeaway.",
        },
        {
          id: "structure",
          description: "Connect your point to an example and a clear close.",
          evidence_required: "An identifiable example and closing sentence.",
        },
      ],
      submission_kind: "text",
      help_rules:
        "Feedback is welcome. Keep the final message in your own words.",
      independence: "guided",
      starting_point:
        "Write: “After hearing this, I want [person] to understand…”",
      dimensions: {
        complexity: "One idea",
        support: "Guided",
        unfamiliarity: "Your chosen topic",
        synthesis: "Audience and structure",
        autonomy: "Your message and example",
      },
    },
  },
  {
    id: "web-development",
    category: "Technology",
    title: "Build a website that solves a real problem",
    description: "Go from a useful idea to a small, accessible web experience.",
    icon: "globe",
    time: "3–4 hours / week",
    tags: ["Web development", "Design", "JavaScript"],
    skills: [
      {
        key: "problem-framing",
        name: "Define a useful problem",
        definition:
          "Describe a user, their task and a measurable successful outcome.",
        relevance: "A useful website begins with a concrete need.",
        prerequisites: [],
        standards: [
          "Describe a user and their goal",
          "Define a testable success condition",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Write a one-page product brief.",
      },
      {
        key: "accessible-interface",
        name: "Build an accessible interface",
        definition:
          "Use semantic HTML and responsive CSS to support a core user task.",
        relevance:
          "Your interface should work across devices and input methods.",
        prerequisites: ["problem-framing"],
        standards: [
          "Use semantic structure and labelled controls",
          "Demonstrate keyboard and small-screen use",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Build one responsive page with a clear primary action.",
      },
      {
        key: "web-interaction",
        name: "Make the interaction reliable",
        definition:
          "Implement a complete interaction with validation and useful state feedback.",
        relevance: "Useful behavior turns a page into a working product.",
        prerequisites: ["accessible-interface"],
        standards: [
          "Validate user input",
          "Handle empty, loading, error and success states",
        ],
        basis: "Learner-selected starter; unverified.",
        next_practice: "Implement and test the primary interaction.",
      },
    ],
    task: {
      title: "Design a tiny useful tool",
      context:
        "Choose a small problem in your daily life. Before building, explain who the tool helps and how you will know it works.",
      deliverable:
        "A short brief with the intended user, problem, one core interaction, a rough layout, and three acceptance checks. You may submit text, a file or a link.",
      skill_keys: ["problem-framing"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 35,
      materials: [
        {
          title: "MDN: Getting started with the web",
          url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started",
          source: "Mozilla MDN Web Docs",
        },
      ],
      criteria: [
        {
          id: "problem",
          description: "Define a concrete user problem and useful outcome.",
          evidence_required: "A named user type and task.",
        },
        {
          id: "success",
          description: "Make success observable.",
          evidence_required: "Three concrete acceptance checks.",
        },
      ],
      submission_kind: "mixed",
      help_rules: "Use examples for inspiration and acknowledge sources.",
      independence: "guided",
      starting_point:
        "Think of something you repeated this week that a small tool could make easier.",
      dimensions: {
        complexity: "One user task",
        support: "Guided",
        unfamiliarity: "A familiar problem",
        synthesis: "User needs and interaction",
        autonomy: "Your idea and decisions",
      },
    },
  },
] as const;

const careerSkill = (
  key: string,
  name: string,
  definition: string,
  prerequisites: string[],
  standards: string[],
) => ({
  key,
  name,
  definition,
  prerequisites,
  standards,
  relevance: "A practical building block for your chosen direction.",
  basis: "Curated starting path; no ability has been assessed.",
  next_practice: "Complete a focused task and explain your choices.",
});
const careerStarters = [
  {
    id: "investment-banking",
    category: "Career & finance",
    title: "Prepare for an investment banking analyst role",
    description:
      "Explore accounting, company analysis and valuation through sourced work. Build preparation, not a promise of an offer.",
    icon: "finance",
    time: "4–6 hours / week",
    tags: ["Finance", "Valuation", "Judgment"],
    skills: [
      careerSkill(
        "financial-statements",
        "Read a business through its accounts",
        "Connect revenue, profit and cash flow in a sourced company report.",
        [],
        [
          "Distinguish earnings from cash flow",
          "Cite figures with reporting period and source",
        ],
      ),
      careerSkill(
        "company-analysis",
        "Explain a company’s economics",
        "Describe business drivers and financial risks using evidence.",
        ["financial-statements"],
        [
          "Write a clear one-page business and financial summary",
          "Separate observation from assumption",
        ],
      ),
      careerSkill(
        "valuation",
        "Build and question a valuation",
        "Choose comparable companies, explain assumptions and test sensitivity.",
        ["company-analysis"],
        [
          "Justify comparable selection",
          "Explain which assumptions drive a valuation",
        ],
      ),
      careerSkill(
        "transaction-judgment",
        "Form a defensible transaction view",
        "Explain deal logic, price, risks and the strongest counterargument.",
        ["valuation"],
        [
          "Make a recommendation supported by assumptions",
          "Test whether the recommendation survives a changed assumption",
        ],
      ),
      careerSkill(
        "finance-transfer",
        "Apply analysis in a new context",
        "Analyze an unfamiliar company and defend choices independently.",
        ["transaction-judgment"],
        ["Complete a new company analysis", "Explain the limits of the method"],
      ),
    ],
    task: {
      title: "Understand one business before valuing it",
      context:
        "Choose a public company you are curious about. Read its latest annual report and begin by understanding how the business makes money. Clarify whether your target is M&A, financing, research or another role.",
      deliverable:
        "A one-page summary: business model, revenue, operating profit, operating cash flow, reporting period, two risks, and an explanation of why profit differs from cash flow. Cite source pages.",
      skill_keys: ["financial-statements", "company-analysis"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 75,
      materials: [
        {
          title: "SEC EDGAR company filings",
          url: "https://www.sec.gov/edgar/search/",
          source:
            "US Securities and Exchange Commission; use the company’s own filed report.",
        },
      ],
      criteria: [
        {
          id: "sources",
          description: "Make financial figures traceable.",
          evidence_required:
            "Reporting period, currency and report page/source.",
        },
        {
          id: "judgment",
          description:
            "Explain the business and distinguish cash flow from profit.",
          evidence_required:
            "A specific comparison and a reasoned explanation.",
        },
      ],
      submission_kind: "mixed",
      help_rules: "Guidance is welcome. Record assumptions and assistance.",
      independence: "guided",
      starting_point:
        "Choose a role direction, then a company. Find the actual annual report before analyzing it.",
      practice_location: "platform",
      verification_method: "ai_rubric",
      verification_boundary:
        "This is preparation evidence, not an employer hiring standard, offer or financial advice. No investment action is required.",
      required_evidence: [
        "A sourced financial summary",
        "Calculation notes",
        "An explanation of key judgments",
      ],
      dimensions: {
        complexity: "One company",
        support: "Guided",
        unfamiliarity: "Your selected industry",
        synthesis: "Accounting and commercial judgment",
        autonomy: "Your choice of company and assumptions",
      },
    },
  },
  {
    id: "professional-cooking",
    category: "Career & craft",
    title: "Build the foundations for a professional kitchen",
    description:
      "Practice real techniques, reflect on consistency, and learn from qualified people who can taste and observe your work.",
    icon: "cooking",
    time: "3–5 hours / week",
    tags: ["Cooking", "Craft", "Real-world practice"],
    skills: [
      careerSkill(
        "kitchen-planning",
        "Plan a safe, achievable practice session",
        "Choose a dish and preparation plan appropriate to your equipment and supervision.",
        [],
        [
          "Describe ingredients, preparation and a sequence",
          "Identify when qualified food-safety guidance is needed",
        ],
      ),
      careerSkill(
        "cooking-technique",
        "Practice one technique deliberately",
        "Repeat one technique while keeping a useful practice record.",
        ["kitchen-planning"],
        [
          "Describe the chosen technique and observable changes",
          "Use qualified feedback for practical technique",
        ],
      ),
      careerSkill(
        "cooking-variables",
        "Understand a changed condition",
        "Change one practical variable and compare outcomes.",
        ["cooking-technique"],
        [
          "Change and record one variable",
          "Explain a difference without overstating what photos establish",
        ],
      ),
      careerSkill(
        "cooking-consistency",
        "Work toward consistent results",
        "Repeat a dish and collect real tasting and process feedback.",
        ["cooking-variables"],
        [
          "Compare multiple attempts",
          "Record feedback about taste and texture from real tasters",
        ],
      ),
      careerSkill(
        "kitchen-practice",
        "Learn in a real kitchen",
        "Participate under qualified supervision and reflect on preparation, collaboration and service.",
        ["cooking-consistency"],
        [
          "Provide supervisor feedback on real practice",
          "Describe a specific change for the next session",
        ],
      ),
    ],
    task: {
      title: "One familiar dish, one intentional practice session",
      context:
        "Start with a familiar, low-risk dish and techniques appropriate to your experience. Clarify whether you want to work in a professional kitchen or eventually lead a restaurant. Michelin stars recognize restaurants; this path cannot confer one.",
      deliverable:
        "A preparation plan, a brief practice log, photographs if useful, and real feedback from someone who tasted the dish. Identify one technique to practice again. Consult qualified food-safety guidance and supervision as appropriate.",
      skill_keys: ["kitchen-planning"],
      prerequisites: [],
      difficulty: "foundation",
      estimated_minutes: 90,
      materials: [],
      criteria: [
        {
          id: "plan",
          description:
            "Make the practice plan achievable and appropriately supervised.",
          evidence_required:
            "Preparation sequence, resources and relevant safety considerations.",
        },
        {
          id: "reflection",
          description:
            "Separate what you observed from what requires real tasting or expert review.",
          evidence_required:
            "Specific feedback and one next practice decision.",
        },
      ],
      submission_kind: "mixed",
      help_rules:
        "Seek qualified supervision for unfamiliar equipment, techniques and food-safety questions.",
      independence: "guided",
      starting_point:
        "Pick a familiar dish and decide who can give you useful real-world feedback.",
      practice_location: "home",
      verification_method: "mentor",
      verification_boundary:
        "AI cannot verify flavor, aroma, internal texture, food safety, live service or kitchen collaboration from photographs. Qualified in-person review is required.",
      required_evidence: [
        "A process record",
        "Actual taster feedback",
        "Qualified supervisor feedback for safety and professional performance",
      ],
      dimensions: {
        complexity: "One dish and one focus",
        support: "Qualified real-world guidance",
        unfamiliarity: "Familiar ingredients",
        synthesis: "Planning, technique and reflection",
        autonomy: "Appropriate to supervised experience",
      },
    },
  },
];
export const starters = [...initialStarters, ...careerStarters].map((s) => ({
  ...s,
  task: {
    practice_location: s.id === "photography" ? "home" : "platform",
    verification_method: "ai_rubric",
    verification_boundary:
      "AI can review submitted explanations. Stored media is not automatically inspected; practical performance may require a qualified reviewer.",
    required_evidence: [
      "Your original work",
      "An explanation of your key choices",
    ],
    ...s.task,
  },
}));
