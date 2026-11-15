// What each exam can ask about. A question may carry an exam's tags only if everything it mentions is in
// that exam's scope: a Meraki question is not an ISC2 CISSP question, and an NX-OS question is not an
// ENAUTO question. Vendor-neutral content (YANG, Jinja2, Git, Terraform, Ansible, AI and so on) fits
// every Cisco exam. The scopes follow the technology lists of the published exam descriptions.
//   300-435 ENAUTO:   IOS XE, Meraki, Catalyst Center, SD-WAN, ISE, ThousandEyes
//   350-901 AUTOCOR:  IOS XE, ACI, Meraki, Catalyst Center, SD-WAN, ISE, Webex
//   300-635 DCNAUTO:  NX-OS, Nexus Dashboard, ACI (network-centric mode), Nexus Hyperfabric
//   200-301 CCNA:     IOS XE, wireless, Catalyst Center, Meraki, ISE (no data center, SD-WAN or Webex)
//   ISC2 CISSP:       vendor-neutral
//   CompTIA SY0-801:  vendor-neutral
export const ENAUTO = "cisco:300-435"
export const AUTOCOR = "cisco:350-901"
export const DCNAUTO = "cisco:300-635"
export const CISSP = "isc2:cissp"
export const SECPLUS = "comptia:sy0-801"
export const CCNA = "cisco:200-301"

const families: Record<string, RegExp> = {
  iosxe: /ios[ -]?xe|iosxe|cisco\.ios|cisco_xe|cisco_ios|\bios_\w+|catalyst 9[0-9]{3}|\bc9[0-9]{3}\b|\bcat9k\b|gigabitethernet|\bgi\d+\/\d+|\bte\d+\/\d+/i,
  meraki: /meraki/i,
  catc: /catalyst center|dna ?center|\bdnac\b|dna-c|network-device-poller|template-programmer|\bswim\b|\bpnp\b/i,
  sdwan: /sd-?wan|vmanage|vsmart|vbond|wan edge|dataservice/i,
  ise: /\bise\b|identity services engine|pxgrid|\bers\b|trustsec|\bsgts?\b|\banc\b/i,
  te: /thousandeyes/i,
  webex: /webex/i,
  nxos: /nx-?os|nxos|cisco_nxos|\bnexus\b|\bn9k\b|nx-api|\bpoap\b|feature (?:nxapi|telemetry|grpc|netconf|bash-shell|scheduler)/i,
  aci: /\baci\b|\bapic\b|\bepgs?\b|bridge domain|\bfv[A-Z]\w+|application[- ]centric/i,
  nexusdash: /nexus dashboard|\bndfc\b|\bdcnm\b|hyperfabric|\bndo\b/i,
}

const allowed: Record<string, string[]> = {
  [ENAUTO]: ["iosxe", "meraki", "catc", "sdwan", "ise", "te"],
  [AUTOCOR]: ["iosxe", "aci", "meraki", "catc", "sdwan", "ise", "webex"],
  [DCNAUTO]: ["nxos", "aci", "nexusdash"],
  [CISSP]: [],
  [SECPLUS]: [],
  [CCNA]: ["iosxe", "catc", "meraki", "ise"],
}

export const mentioned = (corpus: string) =>
  // Purpose: the technology families that the text mentions
  Object.entries(families).filter(([, re]) => re.test(corpus)).map(([name]) => name)

export const fits = (exam: string, corpus: string) => {
  // Purpose: true when everything the text mentions is within the exam's scope
  if ((exam === CISSP || exam === SECPLUS) && /\bcisco\b/i.test(corpus)) return false
  const ok = allowed[exam] ?? []
  return mentioned(corpus).every(f => ok.includes(f))
}

export const examOf = (tagName: string) => {
  // Purpose: the exam a domain or objective tag name belongs to, e.g. cisco:300-435:2.4 -> cisco:300-435
  return tagName.split(":").slice(0, 2).join(":")
}
