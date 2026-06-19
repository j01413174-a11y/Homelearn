export interface K12StateRequirement {
  grade: string;
  subjectsRequired: string[];
  recommendedHoursPerYear: number;
  mandatoryAssessmentYear: boolean;
  commonCoreMathCode: string;
  commonCoreMathDesc: string;
  commonCoreElaCode: string;
  commonCoreElaDesc: string;
  ngssScienceCode: string;
  ngssScienceDesc: string;
  socialStudiesStandard: string;
  homeschoolReportingRule: string;
}

export const K12_STANDARDS_MAP: Record<string, K12StateRequirement> = {
  "Kindergarten": {
    grade: "Kindergarten",
    subjectsRequired: ["Reading Readiness", "Basic Number Concepts", "Socialization", "Creative Arts"],
    recommendedHoursPerYear: 450,
    mandatoryAssessmentYear: false,
    commonCoreMathCode: "CCSS.MATH.K.CC",
    commonCoreMathDesc: "Count to 100, compare numbers, understand basic addition and subtraction.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.K",
    commonCoreElaDesc: "Identify characters, settings, and main events in stories with prompting.",
    ngssScienceCode: "NGSS.K-PS2",
    ngssScienceDesc: "Motion and Stability: Forces and Interactions; Weather patterns and living needs.",
    socialStudiesStandard: "NCSS.K.1: Identify families, helpers in community, and basic geography.",
    homeschoolReportingRule: "Usually low-reporting. Keep a basic log page of daily physical and reading activities."
  },
  "Grade 1": {
    grade: "Grade 1",
    subjectsRequired: ["Arithmetic", "Reading/Writing", "Spelling", "Health", "Social Studies", "Science"],
    recommendedHoursPerYear: 720,
    mandatoryAssessmentYear: false,
    commonCoreMathCode: "CCSS.MATH.1.OA",
    commonCoreMathDesc: "Properties of operations, add/subtract within 20, count to 120, measure lengths.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.1",
    commonCoreElaDesc: "Ask and answer key detail questions in stories, decode simple words phonetically.",
    ngssScienceCode: "NGSS.1-LS1",
    ngssScienceDesc: "From Molecules to Organisms: Structures and Processes; Solar/Lunar cycles.",
    socialStudiesStandard: "NCSS.1.1: Define local rules, historical symbols, basic goods and services trade.",
    homeschoolReportingRule: "Portfolio reviews may start. Store periodic reading logs and math worksheets."
  },
  "Grade 2": {
    grade: "Grade 2",
    subjectsRequired: ["Arithmetic", "Reading/Writing", "Spelling", "Health", "Social Studies", "Science", "Music/Art"],
    recommendedHoursPerYear: 720,
    mandatoryAssessmentYear: false,
    commonCoreMathCode: "CCSS.MATH.2.OA",
    commonCoreMathDesc: "Place value within 1000, addition/subtraction within 100, foundation for fractions and arrays.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.2",
    commonCoreElaDesc: "Describe how characters respond to major events, explain story structures and fables.",
    ngssScienceCode: "NGSS.2-PS1",
    ngssScienceDesc: "Matter and its Interactions; Landforms, water bodies, and quick changes on Earth.",
    socialStudiesStandard: "NCSS.2.2: Acknowledge cultural histories, basic mapping coordinates, local government pillars.",
    homeschoolReportingRule: "Submit annual written notification. Log attendance (180 days typical in most states)."
  },
  "Grade 3": {
    grade: "Grade 3",
    subjectsRequired: ["Mathematics", "English Language Arts", "Science", "Social Studies", "Music/Physical Ed"],
    recommendedHoursPerYear: 900,
    mandatoryAssessmentYear: true,
    commonCoreMathCode: "CCSS.MATH.3.OA",
    commonCoreMathDesc: "Multiplication and division within 100, operations fractions, area calculations.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.3",
    commonCoreElaDesc: "Determine the main theme, recount stories, distinguish point of view.",
    ngssScienceCode: "NGSS.3-ESS1",
    ngssScienceDesc: "Earth's Place in the Universe (Solar Systems, Stars); Life cycles, fossils, natural hazards.",
    socialStudiesStandard: "NCSS.3.3: Indicate indigenous history, municipal laws, basic microeconomics concepts.",
    homeschoolReportingRule: "First major state standardized assessment year (e.g., NY, FL portfolio/CAT test)."
  },
  "Grade 4": {
    grade: "Grade 4",
    subjectsRequired: ["Mathematics", "Reading", "Writing", "Geography", "US History", "Physical Science"],
    recommendedHoursPerYear: 900,
    mandatoryAssessmentYear: false,
    commonCoreMathCode: "CCSS.MATH.4.NBT",
    commonCoreMathDesc: "Multi-digit arithmetic, fraction equivalence, angle measurements.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.4",
    commonCoreElaDesc: "Refer to details for explanations, summarize texts, identify metaphors.",
    ngssScienceCode: "NGSS.4-PS3",
    ngssScienceDesc: "Energy transfer, sound/light waves, geospheres and erosion.",
    socialStudiesStandard: "NCSS.4.4: Evaluate state historical landmarks, state resources, legislative components.",
    homeschoolReportingRule: "Maintain dynamic logs of physical science lab files and written essays."
  },
  "Grade 5": {
    grade: "Grade 5",
    subjectsRequired: ["Pre-Algebra Basics", "Grammar/Literature", "Earth Science", "World Geography", "Fine Arts"],
    recommendedHoursPerYear: 900,
    mandatoryAssessmentYear: true,
    commonCoreMathCode: "CCSS.MATH.5.NBT",
    commonCoreMathDesc: "Perform operations with multi-digit decimals, add/subtract fractions, graph coordinates.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.5",
    commonCoreElaDesc: "Analyze literary themes, quote accurately, determine meaning of academic terms.",
    ngssScienceCode: "NGSS.5-PS1",
    ngssScienceDesc: "Chemical and physical changes, gravity pulls, cycles of matter in ecosystems.",
    socialStudiesStandard: "NCSS.5.5: US Constitution principles, branches of federal government, colonization history.",
    homeschoolReportingRule: "State standard verification checkpoint. Written test or certified portfolio signature required."
  },
  "Grade 6": {
    grade: "Grade 6",
    subjectsRequired: ["Pre-Algebra", "English Grammar", "Life Science", "Ancient Civilizations", "Foreign Language"],
    recommendedHoursPerYear: 900,
    mandatoryAssessmentYear: false,
    commonCoreMathCode: "CCSS.MATH.6.RP",
    commonCoreMathDesc: "Ratios, unit rates, divide fractions, equations, negative integers, statistics.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.6",
    commonCoreElaDesc: "Provide text evidence for analysis, trace an argument, cite multiple sources.",
    ngssScienceCode: "NGSS.MS-LS1",
    ngssScienceDesc: "Middle School Life Science: Cell structures, functions, and organ systems.",
    socialStudiesStandard: "NCSS.6.1: Sumerian, Egyptian, Roman history; ancient trade networks, global biomes.",
    homeschoolReportingRule: "File Middle School Intent form. High-quality transcript logs should begin here."
  },
  "Grade 7": {
    grade: "Grade 7",
    subjectsRequired: ["Algebra Foundations", "Writing & Logic", "Physical Science", "Global Geography", "Fine Arts"],
    recommendedHoursPerYear: 990,
    mandatoryAssessmentYear: true,
    commonCoreMathCode: "CCSS.MATH.7.NS",
    commonCoreMathDesc: "Rational operations, proportionality, expressions, circle area, random sampling.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RI.7",
    commonCoreElaDesc: "Determine technical text meanings, examine author's perspective and rhetoric.",
    ngssScienceCode: "NGSS.MS-PS1",
    ngssScienceDesc: "Middle School Physical Science: Atoms, molecules, chemical reactions, kinetic thermal energy.",
    socialStudiesStandard: "NCSS.7.2: Medieval history, exploration routes, trade empires, constitutional modifications.",
    homeschoolReportingRule: "Submit quarterly progress updates in highly-regulated states (IHIP)."
  },
  "Grade 8": {
    grade: "Grade 8",
    subjectsRequired: ["Algebra I", "Composition", "Earth & Space Science", "US Government/Civics", "Career Prep"],
    recommendedHoursPerYear: 990,
    mandatoryAssessmentYear: true,
    commonCoreMathCode: "CCSS.MATH.8.EE",
    commonCoreMathDesc: "Exponents, scientific notation, linear equations, functions, Pythagorean theorem.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RL.8",
    commonCoreElaDesc: "Analyze dialogue, analyze modern myths, write argumentations with evidence.",
    ngssScienceCode: "NGSS.MS-ESS2",
    ngssScienceDesc: "Middle School Earth Science: Plate tectonics, carbon cycles, climate and weather drivers.",
    socialStudiesStandard: "NCSS.8.3: US Civil War, Industrial Revolution, civic rights and constitutional responsibilities.",
    homeschoolReportingRule: "Assessment check before high school. Certify graduation criteria compatibility."
  },
  "High School (Grades 9-12)": {
    grade: "High School (Grades 9-12)",
    subjectsRequired: ["Algebra I/II or Geometry", "English I-IV", "Biology/Chemistry", "US & World History", "Government/Civics"],
    recommendedHoursPerYear: 1080,
    mandatoryAssessmentYear: true,
    commonCoreMathCode: "CCSS.MATH.HS",
    commonCoreMathDesc: "Conceptual modeling, high school geometry, quadratic functions, statistics & probability.",
    commonCoreElaCode: "CCSS.ELA-LITERACY.RI.9-10",
    commonCoreElaDesc: "Cite thorough textual evidence, evaluate complex chains of logic, master semiotics.",
    ngssScienceCode: "NGSS.HS-PS/LS",
    ngssScienceDesc: "High School chemistry physics, molecular biology, astrophysics, engineering structures.",
    socialStudiesStandard: "NCSS.9-12: Geopolitics, macroeconomics, federalism policies, international alliances.",
    homeschoolReportingRule: "Strict documentation of high school Carnegie credits (1 credit = 120-180 hours)."
  }
};

/**
 * Returns dynamic standard tags matching a lesson subject and grade
 * to guarantee that the content complies directly with US educational standard codes.
 */
export function getStandardForLesson(subject: string, gradeLevel: string): { code: string; desc: string; system: string } {
  // Normalize grade lookup key
  let key = "Grade 3";
  if (gradeLevel.toLowerCase().includes("kindergarten")) {
    key = "Kindergarten";
  } else if (gradeLevel.toLowerCase().includes("1")) {
    key = "Grade 1";
  } else if (gradeLevel.toLowerCase().includes("2")) {
    key = "Grade 2";
  } else if (gradeLevel.toLowerCase().includes("3")) {
    key = "Grade 3";
  } else if (gradeLevel.toLowerCase().includes("4")) {
    key = "Grade 4";
  } else if (gradeLevel.toLowerCase().includes("5")) {
    key = "Grade 5";
  } else if (gradeLevel.toLowerCase().includes("6")) {
    key = "Grade 6";
  } else if (gradeLevel.toLowerCase().includes("7")) {
    key = "Grade 7";
  } else if (gradeLevel.toLowerCase().includes("8")) {
    key = "Grade 8";
  } else {
    key = "High School (Grades 9-12)";
  }

  const req = K12_STANDARDS_MAP[key] || K12_STANDARDS_MAP["Grade 3"];

  if (subject.toLowerCase() === "science") {
    return { code: req.ngssScienceCode, desc: req.ngssScienceDesc, system: "NGSS (Next Gen Science Standards)" };
  } else if (subject.toLowerCase().includes("math") || subject.toLowerCase() === "arithmetic") {
    return { code: req.commonCoreMathCode, desc: req.commonCoreMathDesc, system: "CCSS (Common Core State Standards)" };
  } else if (subject.toLowerCase().includes("history") || subject.toLowerCase().includes("social")) {
    return { code: `NCSS.${key.replace("Grade ", "")}.1`, desc: "National Council for Social Studies: citizenship, cultures, and global geography.", system: "NCSS (National Social Studies)" };
  } else {
    // defaults to English Language Arts Common Core
    return { code: req.commonCoreElaCode, desc: req.commonCoreElaDesc, system: "CCSS (Common Core Language Arts)" };
  }
}
