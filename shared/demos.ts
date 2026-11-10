import { starters } from "./starters";
const skill = (
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
  relevance: "A practical building block for this learning goal.",
  basis: "Illustrative demo path. No learner capability has been assessed.",
  next_practice: "Try a small task and explain the choices you make.",
});
const defaults = {
  preparation:
    "Read the brief and choose what you need to make a first attempt.",
  alternative_task:
    "If the real-world opportunity is unavailable, rehearse or analyze a public example. Mark it as simulated.",
  collaboration_rules:
    "Explain your own contribution and acknowledge any assistance. Follow event-specific AI rules.",
  privacy_notes:
    "Use voluntary notes. Do not record people or share private information without appropriate permission.",
  practice_location: "platform",
  verification_method: "ai_rubric",
  verification_boundary:
    "Only submitted evidence can be assessed. External performance and qualifications are not automatically verified.",
  required_evidence: [
    "A concrete artifact or practice record",
    "A clear explanation of choices",
  ],
  prerequisites: [],
  difficulty: "foundation",
  estimated_minutes: 40,
  materials: [],
  submission_kind: "mixed",
  help_rules: "Guidance is welcome in practice. Declare assistance.",
  independence: "guided",
  dimensions: {
    complexity: "One focused problem",
    support: "Guided",
    unfamiliarity: "A familiar situation",
    synthesis: "Selected skills",
    autonomy: "Learner choices, explained",
  },
};
export const demos = [
  {
    id: "python",
    title: "From “I want to learn Python” to a useful tool",
    label: "Python project",
    icon: "code",
    description:
      "Explore a connected skill map, inspect a real code attempt, and see feedback tied to specific choices.",
    outcome: "Build and explain a small Python expense-summary tool.",
    skills: [
      skill(
        "python-data",
        "Represent simple data",
        "Choose suitable Python data structures for a small real problem.",
        [],
        [
          "Describe the meaning of an input record",
          "Choose and explain a data structure",
        ],
      ),
      skill(
        "python-functions",
        "Write reusable functions",
        "Turn a small repeated calculation into a clear function.",
        ["python-data"],
        [
          "Write a function with clear input and output",
          "Handle an empty input explicitly",
        ],
      ),
      skill(
        "python-testing",
        "Check behavior and explain limits",
        "Use meaningful cases to check the function and describe what remains uncertain.",
        ["python-functions"],
        [
          "Check normal and empty inputs",
          "Explain an assumption and a limitation",
        ],
      ),
    ],
    task: {
      ...defaults,
      title: "Make a weekly spending summary",
      context:
        "You want to understand how much you spend in each category. Start with a small list of expenses and build a summary you can explain.",
      deliverable:
        "A Python function that totals expenses by category, two meaningful example checks, and an explanation of one design choice.",
      skill_keys: ["python-data", "python-functions"],
      criteria: [
        {
          id: "structure",
          description: "Use a clear structure to accumulate category totals.",
          evidence_required:
            "A concrete function and an explanation of the chosen data structure.",
        },
        {
          id: "checks",
          description: "Check at least a normal and an empty input.",
          evidence_required:
            "Two meaningful test cases; actual execution results require a local or isolated runner.",
        },
      ],
      starting_point:
        "Write down two expense records and the output you expect before writing the function.",
    },
    sample: {
      kind: "code",
      content:
        "def summarize(expenses):\n    totals = {}\n    for category, amount in expenses:\n        totals[category] = totals.get(category, 0) + amount\n    return totals\n\nassert summarize([('food', 12), ('books', 8), ('food', 3)]) == {'food': 15, 'books': 8}\nassert summarize([]) == {}\n",
      explanation:
        "I chose a dictionary because each category maps to one running total. Returning an empty dictionary makes an empty input predictable. I assume each record contains a valid numeric amount; I have not handled invalid records or currency precision yet.",
      strength: "A useful data-structure choice is connected to the problem.",
      quote:
        "I chose a dictionary because each category maps to one running total.",
      next: "Add one invalid-input case and decide whether the function should reject it or report it. Then try a different dataset independently.",
    },
  },
  {
    id: "coffee-chat",
    title: "From career curiosity to a thoughtful coffee chat",
    label: "Career exploration",
    icon: "finance",
    description:
      "Prepare an external conversation, keep evidence-based notes, and turn reflection into a useful next practice.",
    outcome:
      "Explore consulting work and practice asking informed, non-leading questions.",
    skills: [
      skill(
        "industry-research",
        "Form informed questions",
        "Distinguish what public research establishes from what a practitioner can clarify.",
        [],
        [
          "Summarize a real project example",
          "Identify a specific unresolved question",
        ],
      ),
      skill(
        "interviewing",
        "Listen and follow up",
        "Prepare focused questions and follow the interviewee’s answer without leading it.",
        ["industry-research"],
        ["Ask three open questions", "Write a relevant follow-up"],
      ),
      skill(
        "evidence-reflection",
        "Separate observation from inference",
        "Compare a practitioner’s perspective with other sources and explain uncertainty.",
        ["interviewing"],
        [
          "Distinguish a reported view from a general fact",
          "Choose one follow-up investigation",
        ],
      ),
    ],
    task: {
      ...defaults,
      title: "Prepare a conversation that can change your understanding",
      practice_location: "external_conversation",
      verification_method: "mixed",
      verification_boundary:
        "Attendance or a reply does not prove communication skill. AI can review preparation and voluntary notes; real interaction needs appropriate feedback.",
      context:
        "You are curious about consulting. Prepare a short introduction and three informed questions for a practitioner. You decide whether and whom to contact. Kleos does not send an invitation.",
      deliverable:
        "A 60-second introduction, three research-informed questions, one follow-up, and a consent-respecting note-taking plan. After a real conversation, submit anonymized notes and a reflection if you choose.",
      skill_keys: ["industry-research", "interviewing"],
      criteria: [
        {
          id: "questions",
          description:
            "Ask informed questions without assuming a preferred answer.",
          evidence_required: "Three specific, open questions.",
        },
        {
          id: "boundaries",
          description: "Plan an ethical conversation and a fallback.",
          evidence_required:
            "A voluntary note-taking plan and an alternative if the person cannot meet.",
        },
      ],
      starting_point:
        "Read one public consulting project case. List what you still do not understand.",
      alternative_task:
        "If nobody is available or an invitation is declined, compare two published practitioner interviews and rehearse a conversation. Label the practice as simulated.",
    },
    sample: {
      kind: "text",
      content:
        "Opening: I’m exploring consulting because I enjoy structuring ambiguous problems. I read a public case about improving a retailer’s operations, and I’d like to understand how that work looks in practice.\n\n1. How did your team decide which part of the problem to investigate first?\n2. What made an analysis useful or unusable for the client?\n3. Which part of the work surprised you when you joined?\n\nFollow-up: Could you give an example of a time when new evidence changed the team’s initial view?\n\nI will ask whether taking brief notes is comfortable. I will not record the conversation or publish identifying details. If a conversation is not possible, I’ll compare two published interviews and clearly label that as desk research.",
      explanation:
        "The questions are open and connected to a real case rather than a generic request for career advice. One person’s experience is a perspective, not a general fact about the whole industry.",
      strength:
        "The preparation separates a practitioner’s perspective from a general industry claim.",
      quote:
        "One person’s experience is a perspective, not a general fact about the whole industry.",
      next: "After a voluntary conversation, note one belief that changed and one question that still needs a second source. Ask for feedback on a specific communication behavior.",
    },
  },
  {
    id: "cooking",
    title: "From a familiar dish to deliberate practice",
    label: "Real-world craft",
    icon: "cooking",
    description:
      "See how the same learning loop supports physical practice while keeping the limits of remote AI clear.",
    outcome:
      "Practice one cooking technique and use actual taster feedback to plan a better second attempt.",
    skills: starters.find((s) => s.id === "professional-cooking")!.skills,
    task: {
      ...defaults,
      ...starters.find((s) => s.id === "professional-cooking")!.task,
    },
    sample: {
      kind: "text",
      content:
        "Practice goal: make a familiar vegetable soup more consistently.\n\nI prepared ingredients before starting and kept a short process log. I used the same recipe and changed only the simmering time between two small batches.\n\nObserved: the vegetables held their shape better in the shorter batch. A photo can show shape and presentation but cannot establish flavor or food safety.\n\nReported taster feedback (illustrative): “The second batch had a more pleasant texture; I would prefer a little more acidity.”\n\nNext attempt: keep the preparation method fixed and ask the taster to compare the two versions without knowing which is which.",
      explanation:
        "Changing one condition makes the comparison easier to interpret. A taster’s opinion is useful feedback, but it is not proof of professional kitchen ability. Safety and unfamiliar techniques require qualified guidance.",
      strength:
        "The reflection keeps what a photo can show separate from what needs a real taster.",
      quote:
        "A photo can show shape and presentation but cannot establish flavor or food safety.",
      next: "Repeat the practice with appropriate qualified guidance and collect real feedback. Keep professional service and food-safety ability pending in-person review.",
    },
  },
];
