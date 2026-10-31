// Catalyst Center (DNA Center) topic set (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
// ---------- 3.1 Day 0: PnP and discovery (7) ----------
{g:3,t:"3.1",y:"x",p:"Match each Plug and Play device state with its meaning.",
s:["Unclaimed","Planned","Onboarding","Provisioned"],
r:["Claimed, and its image and configuration are being applied","Added ahead of time by serial number, but it hasn't contacted Catalyst Center yet","Onboarding finished successfully","It has contacted Catalyst Center but hasn't been claimed"],
o:["1-d, 2-b, 3-a, 4-c","1-b, 2-d, 3-a, 4-c","1-d, 2-a, 3-b, 4-c","1-d, 2-b, 3-c, 4-a"],
e:"Planned devices were imported before they arrived, Unclaimed ones turned up on their own, and claiming moves either kind through Onboarding to Provisioned (or to Error)."},

{g:3,t:"3.1",y:"g",p:"Fill the gaps so new switches on this subnet find Catalyst Center at 10.1.1.10 over HTTP.",
c:`ip dhcp pool PNP-BR21
 network 10.60.0.0 255.255.255.0
 default-router 10.60.0.1
 option ⟦1⟧ ascii "5A1N;B2;K4;I⟦2⟧;J⟦3⟧"`,
bank:["43","67","150","10.1.1.10","10.60.0.1","80","443"],
a:["43","10.1.1.10","80"],
e:"Option 43 carries the PnP string: K4 selects HTTP, I gives the server's address and J its port. Option 67 is for ZTP scripts, and 150 names a TFTP server."},

{g:3,t:"3.1",p:"A branch can't use DHCP option 43. Which DNS record lets new switches there find Catalyst Center?",
o:["pnpserver.<domain>, using the domain name the switch gets from DHCP","catalyst-center.local, found by multicast DNS","pnp.cisco.com, which every switch tries first and which redirects it to the customer's controller","dnac.<domain>, which the switch tries first"],
e:"After option 43, the PnP agent looks up pnpserver in its DHCP domain, then falls back to the PnP Connect cloud (devicehelper.cisco.com)."},

{g:3,t:"3.1",p:"A Day-0 template can't be selected when claiming a device. What's the likely cause?",
o:["It isn't in an Onboarding Configuration project, or it hasn't been committed","It's written in Jinja2, which PnP doesn't support","It has variables, which Day-0 templates can't have","It's associated with a site in Network Profiles, which stops PnP from offering it during a claim"],
e:"PnP claims only offer committed templates from Onboarding Configuration projects. Variables are supplied as configParameters in the claim."},

{g:3,t:"3.1",y:"g",p:"Fill the gaps in this site-claim body for a standalone switch, so the template's HOSTNAME variable becomes BR21-SW1.",
c:`POST /dna/intent/api/v1/onboarding/pnp-device/site-claim
{
  "deviceId": "<pnp-device-id>",
  "siteId": "<site-id>",
  "type": "⟦1⟧",
  "configInfo": {
    "configId": "<template-id>",
    "⟦2⟧": [{"⟦3⟧": "HOSTNAME", "⟦4⟧": "BR21-SW1"}]
  }
}`,
bank:["Default","AccessPoint","StackSwitch","configParameters","parameters","key","name","value"],
a:["Default","configParameters","key","value"],
e:"A standalone switch is claimed with type Default (StackSwitch is for stacks, and AccessPoint needs an RF profile). Template variables are key and value pairs in configParameters."},

{g:3,t:"3.1",p:"Twenty switches are still in transit. How can they be added so each is provisioned as soon as it first connects?",
o:["Import them with POST /dna/intent/api/v1/onboarding/pnp-device/import using serial number and PID, then claim them to their sites","Add them to inventory now with POST /dna/intent/api/v1/network-device, using the IP addresses they'll get from DHCP at the branch later","Run a discovery job over the branch subnet now, so they're found when they boot","Wait until they appear as Unclaimed, because devices can't be added before contact"],
e:"Imported devices are Planned. Claiming them ahead of time means the image and template are applied as soon as each serial calls home."},

{g:3,t:"3.1",p:"Which body starts a discovery of existing switches at 10.20.0.1 to 10.20.0.50 over SSH, using stored credentials?",
o:["{\"name\": \"BR20\", \"discoveryType\": \"Range\", \"ipAddressList\": \"10.20.0.1-10.20.0.50\", \"protocolOrder\": \"ssh\", \"globalCredentialIdList\": [\"<cli-id>\", \"<snmp-id>\"]}",
"{\"name\": \"BR20\", \"discoveryType\": \"CIDR\", \"ipAddressList\": \"10.20.0.1-10.20.0.50\", \"protocolOrder\": \"ssh\", \"globalCredentialIdList\": [\"<cli-id>\", \"<snmp-id>\"]}",
"{\"name\": \"BR20\", \"discoveryType\": \"Range\", \"ipAddressList\": [\"10.20.0.1\", \"10.20.0.50\"], \"protocolOrder\": \"ssh\", \"username\": \"netops\", \"password\": \"<pw>\"}",
"{\"name\": \"BR20\", \"type\": \"Range\", \"range\": \"10.20.0.1-10.20.0.50\", \"protocol\": \"ssh\", \"credentials\": [\"<cli-id>\"]}"],
e:"Discovery takes a discoveryType, here Range with a start-end string, a protocol order, and the IDs of stored global credentials. CIDR would need a prefix such as 10.20.0.0/26."},

// ---------- 3.2 Python and the Intent API (15) ----------
{g:3,t:"3.2",y:"g",p:"Fill the gaps so the script gets a token and lists devices.",
c:`def devices(base, user, pw):
    # Purpose: list the devices in Catalyst Center inventory
    r = requests.post(f"{base}⟦1⟧", auth=(user, pw), verify="ca.pem")
    tok = r.json()["⟦2⟧"]
    r = requests.get(f"{base}/dna/intent/api/v1/network-device",
                     headers={"⟦3⟧": tok}, verify="ca.pem")
    return r.json()["response"]`,
bank:["/dna/system/api/v1/auth/token","/dna/intent/api/v1/auth/token","Token","token","X-Auth-Token","Authorization","X-XSRF-TOKEN"],
a:["/dna/system/api/v1/auth/token","Token","X-Auth-Token"],
e:"The token comes from the system API with Basic authentication, under the key Token with a capital T, and it's sent in X-Auth-Token."},

{g:3,t:"3.2",p:"A collector works for about an hour, then every call returns 401. What should it do?",
o:["Request a new token when a call returns 401, then retry the call","Send the username and password with every call instead of a token","Add a second X-Auth-Token header with the previous token","Wait for an hour, because 401 means the rate limit was hit"],
e:"Tokens are valid for about 60 minutes. Collectors should refresh on 401, or ahead of expiry. Rate limiting returns 429."},

{g:3,t:"3.2",y:"g",p:"Fill the gaps so the loop pages through every device.",
c:`def all_devices(base, hdr):
    # Purpose: read the whole inventory a page at a time
    out, offset, limit = [], ⟦1⟧, ⟦2⟧
    while True:
        r = requests.get(f"{base}/dna/intent/api/v1/network-device",
                         headers=hdr, verify="ca.pem",
                         params={"offset": offset, "limit": limit})
        page = r.json()["response"]
        out += page
        if len(page) < limit:
            return out
        offset += ⟦3⟧`,
bank:["0","1","100","500","1000","limit","1 + limit"],
a:["1","500","limit"],
e:"The device list's offset starts at 1, not 0, and limit can be at most 500. Each loop moves on by one page."},

{g:3,t:"3.2",p:"A task returned by a POST shows this. What does it mean?",
c:`{"response": {
   "taskId": "a1f3...",
   "progress": "Provisioning failed for 10.20.0.14",
   "isError": true,
   "failureReason": "NCSP10250: Device is unreachable",
   "startTime": 1761700000000,
   "endTime": 1761700042000
}}`,
o:["The task has finished and failed; failureReason explains why","The task is still running, because isError is set before it ends","The task succeeded, because endTime is present","The request was rejected before a task was created"],
e:"endTime means the task has finished, and isError: true means it failed. A running task has no endTime yet."},

{g:3,t:"3.2",p:"Which headers make POST /dna/system/api/v1/site wait and return the result, instead of a task ID?",
o:["\"__runsync\": \"true\" and \"__runsynctimeout\": \"30\"","\"Prefer\": \"respond-async\"","\"X-Run-Synchronous\": \"true\" and \"X-Sync-Timeout\": \"30\"","\"__async\": \"false\""],
e:"The site API accepts __runsync to run synchronously, with __runsynctimeout in seconds. Without them, it returns an execution to poll."},

{g:3,t:"3.2",p:"Which body creates building HQ under the area Global/NZ/Auckland?",
o:["{\"type\": \"building\", \"site\": {\"building\": {\"name\": \"HQ\", \"parentName\": \"Global/NZ/Auckland\", \"latitude\": -36.85, \"longitude\": 174.76, \"address\": \"1 Queen St, Auckland\"}}}",
"{\"type\": \"area\", \"site\": {\"building\": {\"name\": \"HQ\", \"parentName\": \"Global/NZ/Auckland\", \"latitude\": -36.85, \"longitude\": 174.76, \"address\": \"1 Queen St, Auckland\"}}}",
"{\"type\": \"building\", \"site\": {\"building\": {\"name\": \"Global/NZ/Auckland/HQ\", \"latitude\": -36.85, \"longitude\": 174.76}}}",
"{\"type\": \"building\", \"site\": {\"area\": {\"name\": \"HQ\", \"parentName\": \"Global/NZ/Auckland\"}}}"],
e:"type and the object under site must agree. Buildings need a location (coordinates or an address), and name holds just the site's own name, with the path in parentName."},

{g:3,t:"3.2",p:"What does the Python SDK, dnacentersdk, handle that a script using requests must do itself?",
c:`from dnacentersdk import api

dnac = api.DNACenterAPI(base_url="https://catc.example.com",
                        username=user, password=pw,
                        version="2.3.7.6", verify="ca.pem")
devs = dnac.devices.get_device_list(family="Switches and Hubs")`,
o:["Getting and refreshing the token, choosing the methods for the API version, and waiting on rate limits","Creating Catalyst Center service accounts with the right roles for each script, and rotating their passwords","Converting each call into a NETCONF request to the devices","Turning asynchronous tasks into immediate results on the server"],
e:"The SDK manages authentication and token renewal, maps methods to the chosen API version, and can wait and retry when rate limited. Tasks are still asynchronous on the server."},

{g:3,t:"3.2",y:"g",p:"Fill the gaps so the SDK call lists every switch.",
c:`dnac = api.DNACenterAPI(base_url=url, username=user, password=pw,
                        version="2.3.7.6", verify="ca.pem")
switches = dnac.⟦1⟧.⟦2⟧(family="Switches and Hubs")`,
bank:["devices","sites","network_device","get_device_list","list_devices","get_devices"],
a:["devices","get_device_list"],
e:"dnacentersdk groups methods by API area, so inventory calls live under devices, and the list call is get_device_list with the same filters as the REST endpoint."},

{g:3,t:"3.2",p:"A script has a device's UUID and needs its interfaces with status and VLAN. Which request fits?",
o:["GET /dna/intent/api/v1/interface/network-device/{deviceId}","GET /dna/intent/api/v1/network-device/{deviceId}/interfaces/status","GET /dna/intent/api/v1/network-device/{deviceId}/config","GET /dna/intent/api/v1/topology/physical-topology?deviceId={deviceId}"],
e:"Interfaces for a device live under the interface resource. The config endpoint returns the running configuration as text."},

{g:3,t:"3.2",p:"A script needs a switch's running configuration as Catalyst Center last collected it. Which request fits?",
o:["GET /dna/intent/api/v1/network-device/{id}/config","GET /dna/intent/api/v1/network-device/{id}?config=running","POST /dna/intent/api/v1/network-device-poller/cli/read-request with show running-config","GET /dna/intent/api/v1/compliance/{id}/detail"],
e:"The config endpoint returns the stored running configuration straight away. Command Runner also works but is asynchronous and fetches it live."},

{g:3,t:"3.2",y:"m",p:"Which two statements about Command Runner are true? (Choose two.)",
o:["It only accepts read-only commands; configuration commands come back as BLACKLISTED","It returns a task, and the finished task's progress holds a fileId with the output","It runs configuration commands in order across the devices and rolls them all back if any one of them fails","It returns each command's output directly in the POST response","It needs NETCONF on the target devices"],
e:"Command Runner is for show commands over the CLI. Output is collected asynchronously into a file, which is read with GET /dna/intent/api/v1/file/{fileId}."},

{g:3,t:"3.2",y:"g",p:"The Command Runner output file has been read into out. Fill the gaps to get the show version text for the first device.",
c:`out = requests.get(f"{base}/dna/intent/api/v1/file/{file_id}",
                   headers=hdr, verify="ca.pem").json()
text = out[0]["⟦1⟧"]["⟦2⟧"]["show version"]`,
bank:["commandResponses","response","output","SUCCESS","FAILURE","BLACKLISTED"],
a:["commandResponses","SUCCESS"],
e:"The file holds one entry per device, with commandResponses split into SUCCESS, FAILURE and BLACKLISTED, each keyed by command."},

{g:3,t:"3.2",p:"Inventory doesn't yet show a change made on five switches. Which request refreshes them now?",
o:["PUT /dna/intent/api/v1/network-device/sync?forceSync=true with a list of the five device IDs","POST /dna/intent/api/v1/network-device with the five IP addresses","DELETE /dna/intent/api/v1/network-device/{id} on each switch, then run discovery again so they're re-added fresh","GET /dna/intent/api/v1/network-device?refresh=true"],
e:"A resync collects the devices' current state on demand, instead of waiting for the next scheduled collection. Deleting and rediscovering would lose their site and settings."},

{g:3,t:"3.2",y:"x",p:"Match each Catalyst Center API category with what it's for.",
s:["Intent API (northbound)","Integration API","Multivendor SDK (southbound)","Events and Notifications (eastbound)"],
r:["Pushing events from Catalyst Center to webhooks, email and syslog","Connecting to IT systems such as ServiceNow and IPAM","Managing network intent, such as sites, devices, templates and health","Adding support for third-party devices"],
o:["1-c, 2-b, 3-d, 4-a","1-b, 2-c, 3-d, 4-a","1-c, 2-d, 3-b, 4-a","1-c, 2-b, 3-a, 4-d"],
e:"Scripts mostly use the Intent API. Integration bundles connect to ITSM and IPAM tools, device packages extend southbound support, and events flow out to subscribers."},

{g:3,t:"3.2",p:"A GET on /dna/intent/api/v1/site?name=Global/NZ/Auckland/HQ succeeds. Which expression gives the site's ID?",
o:["r.json()[\"response\"][0][\"id\"]","r.json()[\"response\"][\"id\"]","r.json()[\"id\"]","r.json()[\"response\"][0][\"siteId\"]"],
e:"The site query returns a list in response, even for an exact name match, and each site's identifier is id."},

// ---------- 3.3 Templates (4) ----------
{g:3,t:"3.3",y:"m",p:"Which two template languages does the Catalyst Center Template Editor support? (Choose two.)",
o:["Apache Velocity","Jinja2","Mustache","Go templates","Embedded Ruby (ERB)"],
e:"Templates can be written in Velocity or Jinja2. Velocity uses $variables and #directives, and Jinja2 uses {{ }} and {% %}."},

{g:3,t:"3.3",y:"g",p:"Fill the gaps in this Velocity template so it creates every VLAN in the vlans list.",
c:`hostname $hostname
⟦1⟧($vlan in $vlans)
vlan $vlan
⟦2⟧`,
bank:["#foreach","#for","{% for %}","#end","#endfor","{% endfor %}"],
a:["#foreach","#end"],
e:"Velocity loops are #foreach ... #end. #for and #endfor aren't Velocity directives, and {% %} tags are Jinja2."},

{g:3,t:"3.3",p:"What's a composite template in Catalyst Center?",
o:["An ordered set of regular templates deployed together as one","A template that includes both Velocity and Jinja2 code","A template that applies to every device family at once","A template that holds other composite templates nested inside it"],
e:"Composite templates sequence regular templates, for example base, then interfaces, then routing. They can't contain other composite templates."},

{g:3,t:"3.3",p:"An engineer edits a template, then deploys it, but the devices receive the old configuration. Why?",
o:["The edit wasn't committed, and deployments use the latest committed version","Templates only update at the next scheduled sync","The template's language changed when it was edited","Deployments always use the first version of a template, until older versions are deleted from the project"],
e:"Template edits are saved as a draft until committed, which creates a new version. Deploying uses committed versions."},

// ---------- 3.4 Ansible (4) ----------
{g:3,t:"3.4",y:"g",p:"Fill the gaps with the cisco.dnac connection options.",
c:`- hosts: localhost
  connection: local
  gather_facts: false
  vars:
    dnac_login: &dnac_login
      ⟦1⟧: catc.example.com
      ⟦2⟧: "{{ vault_cc_user }}"
      dnac_password: "{{ vault_cc_pass }}"
      ⟦3⟧: true
      dnac_version: "2.3.7.6"
  tasks:
    - name: List switches
      cisco.dnac.network_device_info:
        <<: *dnac_login
        family: Switches and Hubs`,
bank:["dnac_host","dnac_hostname","dnac_username","dnac_user","dnac_verify","validate_certs"],
a:["dnac_host","dnac_username","dnac_verify"],
e:"The collection's modules share dnac_host, dnac_username, dnac_password, dnac_verify and dnac_version. A YAML anchor avoids repeating them on each task."},

{g:3,t:"3.4",p:"What does state: merged do in a cisco.dnac workflow manager module, such as site_workflow_manager?",
o:["Creates or updates the objects in config so they match it, leaving others alone","Deletes every object not listed in config","Only reports differences without changing anything","Replaces every object of that type with exactly what's in config, deleting anything that isn't listed"],
e:"Workflow manager modules take a config list with state merged (create or update) or deleted (remove). They're idempotent, so a second run makes no changes."},

{g:3,t:"3.4",p:"Which cisco.dnac module type reads data without changing anything?",
o:["The _info modules, such as network_device_info","Any module run with state: merged in check mode","The workflow manager modules with an empty config","The template deploy module with preview: true"],
e:"Info modules map to GET operations and are safe to run at any time."},

{g:3,t:"3.4",p:"A cisco.dnac task fails with an error saying a required Python package is missing. What's the fix?",
o:["Install dnacentersdk in the Python interpreter Ansible uses on the control node","Install the package on each managed switch","Change the connection to network_cli","Enable the REST API bundle in Catalyst Center, which installs the Python package the modules need"],
e:"The collection runs locally and calls Catalyst Center through dnacentersdk, so the SDK must be installed where the modules run."},

// ---------- 3.5 Security, compliance and segmentation (7) ----------
{g:3,t:"3.5",p:"Someone changed a switch's configuration from its CLI, bypassing Catalyst Center. Which compliance category flags it?",
o:["RUNNING_CONFIG","IMAGE","PSIRT","EOX"],
e:"Running configuration compliance detects out-of-band changes. IMAGE compares software with the golden image, PSIRT checks advisories, and EOX covers end-of-life."},

{g:3,t:"3.5",p:"Security wants a list of which devices are exposed to each published Cisco advisory. Which API fits?",
o:["GET /dna/intent/api/v1/security-advisory/advisory, then each advisory's device list","GET /dna/intent/api/v1/network-device?psirt=true","GET /dna/intent/api/v1/issues?category=security","GET /dna/intent/api/v1/compliance?complianceType=SECURITY, then read each device's affected advisories"],
e:"The advisories API matches device software against Cisco PSIRT data, and each advisory links to its affected devices."},

{g:3,t:"3.5",y:"m",p:"Which two statements about segmentation in SD-Access are true? (Choose two.)",
o:["Virtual networks (VRFs) give macro-segmentation, isolating whole routing domains","Scalable group tags (SGTs) give micro-segmentation between groups within a virtual network","Each scalable group needs its own virtual network","Virtual networks are enforced only by firewalls outside the fabric","SGTs are carried only in each device's configuration, never in the traffic itself, so they can't cross the fabric"],
e:"VNs keep separate routing tables, and SGTs, carried in the VXLAN header, let policy apply between groups inside one VN."},

{g:3,t:"3.5",p:"Where do SD-Access fabric switches get the SGACL policies they enforce?",
o:["From ISE, which receives the scalable groups and contracts defined in Catalyst Center","From Catalyst Center, which pushes the SGACLs into every fabric switch's running configuration directly","From the fabric control plane node, using LISP","From the border node, which floods them to the edges"],
e:"Catalyst Center is where policy is defined, but ISE stores it and serves SGACLs to switches when they need them."},

{g:3,t:"3.5",p:"Contractors must be blocked from the PCI servers' group in SD-Access, everywhere. What's the approach?",
o:["Apply a deny access contract from the Contractors group to the PCI group in the group-based policy matrix","Create an ACL that denies the PCI subnets on each edge switch's uplink, and keep it updated with a template","Put contractors in a different site","Remove the PCI group from ISE"],
e:"Group-based policy is defined once, from source group to destination group, and is enforced wherever the traffic enters the fabric."},

{g:3,t:"3.5",p:"An assurance dashboard script only needs to read health data. Which account should it use?",
o:["An account with the Observer role, or a custom role with read-only access to Assurance","An account with the Super Admin role, so no calls fail","The same personal admin account the engineer uses","An account with the Network Admin role, which Catalyst Center treats as read-only for API access"],
e:"Least privilege limits the damage if the credentials leak. Read-only scripts don't need write roles."},

{g:3,t:"3.5",p:"After a golden image is tagged, which compliance status shows that a switch still runs an older version?",
o:["Its IMAGE compliance shows non-compliant (outdated)","Its RUNNING_CONFIG compliance shows non-compliant","Its reachability shows Unreachable","Its PnP state shows Error"],
e:"Image compliance compares each device's software with the golden image for its site, family and role."},

// ---------- 3.6 Troubleshooting (6) ----------
{g:3,t:"3.6",p:"A script calls GET /dna/intent/api/v1/network-device/akl-sw1 and gets 404, but the device is in inventory. Why?",
o:["The path needs the device's UUID, not its hostname; look the UUID up with a filter first","Hostnames are case-sensitive and must be upper case","The device must be synced before it can be read","The script needs the Super Admin role, because only that role can read a device by its hostname"],
e:"Path parameters are IDs. Filters such as ?hostname=akl-sw1 on the list endpoint find the ID first."},

{g:3,t:"3.6",p:"A POST by an account with the Observer role returns 403. What's the cause?",
o:["The role doesn't allow write operations","The token has expired","The body is missing Content-Type","The API rate limit was exceeded"],
e:"403 means the caller is authenticated but not authorized. Expired tokens give 401, a missing media type gives 415, and rate limiting gives 429."},

{g:3,t:"3.6",p:"A provisioning task shows isError: true with a vague failureReason. How can the script find which step failed?",
o:["GET /dna/intent/api/v1/task/{taskId}/tree, and read the subtasks' progress and failure details","Repeat the POST with debug=true","Read the device's syslog only","GET /dna/intent/api/v1/task?isError=true, which lists every failed task in the system with its full details"],
e:"Complex operations run as a tree of tasks. The tree shows each child task's progress and error."},

{g:3,t:"3.6",p:"Command Runner returns BLACKLISTED for configure terminal and interface commands. What's the right way to push configuration?",
o:["Use a template, deployed through the Template Programmer API","Send each command on its own line to Command Runner","Add the commands to the legit-reads list","Prefix the commands with do"],
e:"Command Runner is read-only by design. GET /dna/intent/api/v1/network-device-poller/cli/legit-reads lists the keywords it accepts. Configuration changes go through templates or intent APIs."},

{g:3,t:"3.6",p:"A collector that loops quickly over many sites starts getting 429. What should it do?",
o:["Back off and retry, or let dnacentersdk wait on rate limits, and spread the calls out","Get a new token, because 429 means it expired","Switch to a Super Admin account, because rate limits don't apply to administrator sessions","Run the loop in more threads"],
e:"429 means too many requests in a period. Slowing down is the fix, and the SDK can handle it for you."},

{g:3,t:"3.6",p:"A discovery finds the switches, but they show Could Not Synchronize. What's the most likely cause?",
o:["The CLI or SNMP credentials don't work on those devices","The switches need Plug and Play to be enabled","The switches aren't assigned to a site yet","The discovery used Range instead of CDP"],
e:"Discovery can reach the devices, but inventory collection needs working CLI and SNMP access. Check the credentials and that SSH or SNMP is allowed."},

// ---------- 4.1 Testing and validation (3) ----------
{g:4,t:"4.1",y:"g",p:"Fill the gaps so Path Trace checks HTTPS from a user to a server, including the ACLs on the way.",
c:`POST /dna/intent/api/v1/flow-analysis
{
  "⟦1⟧": "10.10.20.5",
  "⟦2⟧": "10.50.1.10",
  "destPort": "443",
  "protocol": "⟦3⟧",
  "inclusions": ["⟦4⟧", "INTERFACE-STATS"]
}`,
bank:["sourceIP","sourceIp","destIP","destinationIP","TCP","6","ACL-TRACE","ACL-STATS"],
a:["sourceIP","destIP","TCP","ACL-TRACE"],
e:"Path Trace takes sourceIP and destIP, with optional ports and protocol. inclusions add details such as ACL-TRACE, INTERFACE-STATS, QOS-STATS and DEVICE-STATS."},

{g:4,t:"4.1",p:"POST /dna/intent/api/v1/flow-analysis returned a flowAnalysisId. How does the script get the path?",
o:["GET /dna/intent/api/v1/flow-analysis/{flowAnalysisId} until the request status is COMPLETED","GET /dna/intent/api/v1/task/{flowAnalysisId}","Read the path from the POST response, which already contains it","GET /dna/intent/api/v1/topology/physical-topology?flow={flowAnalysisId}, which highlights the path"],
e:"Path Trace runs in the background, and its own resource reports the status and, once complete, the hop-by-hop path."},

{g:4,t:"4.1",p:"A change needs before and after checks on 40 switches, without logging in to each one. Which approach fits?",
o:["Run the same show commands through Command Runner before and after, then compare the outputs","Deploy a template on each switch that runs the show commands and returns their output to Catalyst Center","Check site health once after the change","Compare the switches' PnP states"],
e:"Command Runner collects show output across many devices through one API, which suits pre- and post-change validation."},

// ---------- 4.3 Software image management (4) ----------
{g:4,t:"4.3",y:"o",p:"Put the SWIM steps for upgrading a group of switches in order.",
s:["Activate the image on the switches","Import the image into the repository","Run the image update readiness check","Tag the image golden for the family, role and site","Distribute the image to the switches"],
o:["2, 4, 3, 5, 1","2, 3, 4, 5, 1","4, 2, 3, 5, 1","2, 4, 5, 3, 1"],
e:"The image has to be in the repository before it can be tagged, and the readiness check confirms flash space and other prerequisites before it's copied and activated."},

{g:4,t:"4.3",p:"What does distributeIfNeeded: true do in an activation request?",
c:`POST /dna/intent/api/v1/image/activation/device
[{"deviceUuid": "<device-id>", "imageUuidList": ["<image-id>"],
  "activateLowerImageVersion": false, "distributeIfNeeded": true}]`,
o:["Copies the image to the device first if it isn't there, then activates it","Activates only if the device needs a newer version than it runs","Distributes the image to every device in the site","Skips activation if the image is already distributed"],
e:"It lets activation handle distribution in one step. activateLowerImageVersion controls whether a downgrade is allowed."},

{g:4,t:"4.3",p:"An image is imported with POST /dna/intent/api/v1/image/importation/source/url, but the task fails. What must be true for this method to work?",
o:["Catalyst Center must be able to reach the URL and download the file","The script must upload the file in the request body","The image must already be tagged golden","The URL must point to a switch's flash"],
e:"With source/url, Catalyst Center fetches the image itself from the HTTP or FTP server. Uploading from the client uses source/file."},

{g:4,t:"4.3",p:"Which request lists the golden images for Catalyst 9300 switches?",
o:["GET /dna/intent/api/v1/image/importation?isTaggedGolden=true&family=Cisco Catalyst 9300 Switch","GET /dna/intent/api/v1/image/importation/golden","GET /dna/intent/api/v1/network-device?golden=true","GET /dna/intent/api/v1/image/importation/golden?family=Cisco Catalyst 9300 Switch&siteId=Global"],
e:"The image list takes filters such as isTaggedGolden and family. The golden endpoint tags or untags images rather than listing them."},

// ---------- 4.4 Assurance and health (5) ----------
{g:4,t:"4.4",p:"How does a script get Assurance's issues and suggested actions for one device, using the issue enrichment API?",
o:["GET /dna/intent/api/v1/issue-enrichment-details with headers entity_type: network_device and entity_value set to the device's MAC","GET /dna/intent/api/v1/issues/{deviceId}","GET /dna/intent/api/v1/device-health?mac=<mac>","POST /dna/intent/api/v1/issues with the device's hostname and MAC in the body, which returns its issues and the suggested actions"],
e:"Enrichment APIs take the entity in headers. For devices, entity_value is the MAC or IP address, and the reply includes issues with suggested actions."},

{g:4,t:"4.4",p:"A help desk tool needs one client's health, connection details and onboarding history. Which request fits?",
o:["GET /dna/intent/api/v1/client-detail?macAddress=<mac>&timestamp=<epoch-ms>","GET /dna/intent/api/v1/client-health?macAddress=<mac>","GET /dna/intent/api/v1/network-device?macAddress=<mac>&includeClients=true","GET /dna/intent/api/v1/site-health?client=<mac>"],
e:"client-detail covers a single client. client-health returns overall counts and scores, and network-device covers infrastructure."},

{g:4,t:"4.4",p:"A device's health score is 3. How does Assurance classify it?",
o:["Poor (1 to 3)","Fair (1 to 3)","Good (above 2)","Critical (1 to 5)"],
e:"Health scores run from 1 to 10: Poor is 1 to 3, Fair 4 to 7, and Good 8 to 10. A score of 0 means no data."},

{g:4,t:"4.4",y:"g",p:"Fill the gaps so the request returns only active P1 issues.",
c:`r = requests.get(f"{base}/dna/intent/api/v1/issues",
                 headers=hdr, verify="ca.pem",
                 params={"priority": "⟦1⟧", "issueStatus": "⟦2⟧"})`,
bank:["P1","1","CRITICAL","ACTIVE","OPEN","RESOLVED"],
a:["P1","ACTIVE"],
e:"Issue priorities are P1 to P4, and issueStatus can be ACTIVE, IGNORED or RESOLVED."},

{g:4,t:"4.4",p:"A tool must draw which devices connect to which, from Catalyst Center. Which request fits?",
o:["GET /dna/intent/api/v1/topology/physical-topology","GET /dna/intent/api/v1/site-health","GET /dna/intent/api/v1/network-device/count","GET /dna/intent/api/v1/topology/site-topology"],
e:"Physical topology returns nodes and links. Site topology only gives the site hierarchy."},

// ---------- 4.6 Events and webhooks (3) ----------
{g:4,t:"4.6",y:"g",p:"Fill the gaps so this subscription sends device-unreachable events to an existing webhook destination.",
c:`POST /dna/intent/api/v1/event/subscription/rest
[{
  "name": "Device unreachable",
  "filter": {"⟦1⟧": ["NETWORK-DEVICES-3-251"]},
  "subscriptionEndpoints": [{
    "⟦2⟧": "<webhook-destination-id>",
    "subscriptionDetails": {"connectorType": "⟦3⟧"}
  }]
}]`,
bank:["eventIds","events","instanceId","destinationId","REST","WEBHOOK","EMAIL"],
a:["eventIds","instanceId","REST"],
e:"Subscriptions filter on eventIds and point at a destination by its instanceId. REST is the connector type for webhooks."},

{g:4,t:"4.6",p:"Where does a script find the event IDs that can be subscribed to, such as the one for a device becoming unreachable?",
o:["GET /dna/intent/api/v1/events, the event catalog, filtered with tags such as ASSURANCE","GET /dna/intent/api/v1/issues, because each issue's ID is the same as the event ID used in subscriptions","GET /dna/intent/api/v1/task, which lists event types","The device's syslog messages"],
e:"The event catalog lists every event type with its ID, domain and severity. Subscriptions refer to those IDs."},

{g:4,t:"4.6",y:"m",p:"A Catalyst Center webhook receiver sometimes gets the same event twice, and is slow to process each one. Which two changes help? (Choose two.)",
o:["Reply 2xx straight away and process events from a queue","De-duplicate events by their instanceId","Return 500 so Catalyst Center stops retrying","Switch to plain HTTP to speed up delivery","Poll the events API instead of receiving webhooks"],
e:"Slow or failed replies cause retries and duplicates. Acknowledge quickly, and make processing idempotent."},

// ---------- 5.x AI (2) ----------
{g:5,t:"5.1",p:"What must be in place for Catalyst Center to give AI-driven dynamic baselines and trend insights?",
o:["AI Network Analytics turned on, with Catalyst Center sending telemetry to the Cisco AI cloud","A Super Admin running a manual baseline job each week from the Assurance settings page, for every site","A second Catalyst Center cluster dedicated to AI","Every device running the golden image"],
e:"AI Network Analytics models each network's normal behavior in the cloud, and needs the data export enabled. Without it, Assurance uses static thresholds."},

{g:5,t:"5.4",p:"A FastMCP server gives an AI agent Catalyst Center site health. How should its access be set up?",
o:["A read-only (Observer-role) account, with credentials kept in the server's environment, never in tool arguments","The engineer's Super Admin account, passed in each tool call","An account whose password is written in the tool's docstring, so the model can log in by itself whenever it needs to","No account, because the agent can read the GUI instead"],
e:"The server should authenticate with a least-privilege account and keep secrets out of anything the model sees, such as arguments, prompts and descriptions."}
];
