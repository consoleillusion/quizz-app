// Exam blueprints, used to group results by domain. Objectives look like "300-435:2.3".

export const exams: Record<string, {name: string, domains: Record<string, string>}> = {
  "300-435": {
    name: "ENAUTO 300-435 v2.0",
    domains: {
      "1": "Network Automation Foundation",
      "2": "Device-Level Network Automation",
      "3": "Controller-Based Network Automation",
      "4": "Operations",
      "5": "AI in Automation",
    },
  },
}

export const parseObjective = (objective: string) => {
  // Purpose: split "300-435:2.3" into exam, domain and objective number
  const [exam, number] = objective.split(":")
  return {exam, number, domain: number.split(".")[0]}
}

export const domainLabel = (objective: string) => {
  // Purpose: name the blueprint domain an objective belongs to, e.g. "2.0 Device-Level Network Automation"
  const {exam, domain} = parseObjective(objective)
  const name = exams[exam]?.domains[domain]
  return name ? `${domain}.0 ${name}` : `Domain ${domain}`
}
