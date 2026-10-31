// Catalyst SD-WAN topic set (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
// ---------- 3.1 Day 0 and onboarding (9) ----------
{g:3,t:"3.1",y:"m",p:"Which two statements describe the SD-WAN Validator's role? (Choose two.)",
o:["It's the first controller a new WAN edge contacts, and it authenticates the edge","It tells the edge how to reach SD-WAN Manager and the Controllers, and helps with NAT traversal","It distributes OMP routes and centralized policies to the WAN edges once they've been authenticated","It stores device templates and pushes configuration to the edges","It forwards user traffic between sites that can't build direct tunnels"],
e:"The Validator (formerly vBond) orchestrates onboarding: it authenticates devices and points them at the Manager and Controllers. Controllers run OMP and distribute policy, and the Manager holds templates. None of them forward user traffic."},

{g:3,t:"3.1",p:"SD-WAN Manager has no internet access, so it can't sync with Plug and Play Connect. How does it get the list of authorized WAN edges?",
o:["Download the signed provisioning file from Plug and Play Connect and upload it to SD-WAN Manager","Type each serial number into SD-WAN Manager, which then signs the list itself","Let the edges register on first contact, because the allow list is filled automatically","Copy the list from the Validator, which fetches it from the cloud for the Manager"],
e:"The WAN edge list is a signed file (serialFile.viptela). Manager can sync it from the Smart Account online or import it offline. Unlisted devices aren't trusted."},

{g:3,t:"3.1",y:"o",p:"Put the steps that let a newly listed WAN edge join the overlay in order.",
s:["Send the updated list to the Controllers and Validators","Upload or sync the WAN edge list in SD-WAN Manager","The edge connects, and the Validator checks it against the list","Mark the edge's certificate as Valid"],
o:["2, 4, 1, 3","4, 2, 1, 3","2, 1, 4, 3","2, 4, 3, 1"],
e:"The device has to be listed before it can be marked Valid, and the Validators and Controllers only accept it once the updated list reaches them."},

{g:3,t:"3.1",p:"A remote site has no path to the Plug and Play Connect cloud. How can its new Catalyst 8300 still onboard?",
o:["Generate a bootstrap file for it in SD-WAN Manager, and load it from bootflash or USB at first boot","Configure it by hand in CLI mode, which SD-WAN Manager adopts as its template","Point its DHCP option 43 at SD-WAN Manager, which then acts as the PnP server","It can't onboard until it can reach Plug and Play Connect"],
e:"The bootstrap file (cloud-init format for IOS XE edges) carries the Validator address, organization name, system IP and site ID, so the edge can join without the cloud redirect."},

{g:3,t:"3.1",y:"m",p:"Which two statements about system IP and site ID are true? (Choose two.)",
o:["The system IP must be unique for each device; it identifies the device and its TLOCs","Edges with the same site ID don't build data plane tunnels to each other","The system IP must be routable on the WAN transport, because tunnels are built to it","Every device in the overlay must have a different site ID","The site ID becomes the OMP router's AS number"],
e:"The system IP is a unique identifier, like a router ID, and doesn't need to be routable. Edges at one site share a site ID, which also stops tunnels being built between them."},

{g:3,t:"3.1",p:"Configuration should go to a new WAN edge the moment it first joins. What allows that?",
o:["Attach the device template, or deploy the configuration group, to the edge's entry before it comes online","Wait until it joins, then attach the template, because offline devices can't be attached, even if they're already in the WAN edge list","Pre-load the template on the Validator, which pushes it during authentication","Put the full configuration in the PnP Connect controller profile"],
e:"Devices in the WAN edge list can have their configuration attached in advance. SD-WAN Manager pushes it as soon as the edge connects."},

{g:3,t:"3.1",p:"Which statement about configuration groups in SD-WAN Manager is accurate?",
o:["They're built from feature profiles, such as system, transport and service, and deployed to associated devices with per-device variable values","They replace the WAN edge list and certificate checks, so devices associated with a configuration group don't need to be authorized separately","They can only be applied by the CLI and aren't exposed through the API","They apply only to Controllers and Validators, not to WAN edges"],
e:"Configuration groups are the newer alternative to device templates. You associate devices, supply variables and deploy. Authorization still depends on the WAN edge list."},

{g:3,t:"3.1",p:"A new edge boots with no configuration and must onboard through PnP. What does it need on its WAN interface?",
o:["A DHCP address, DNS, and internet access to reach Plug and Play Connect (devicehelper.cisco.com)","A static address, gateway and DNS configured by hand on the WAN port, because PnP onboarding doesn't use DHCP","A direct link to SD-WAN Manager on the same subnet","A NETCONF session from SD-WAN Manager, opened on port 830"],
e:"The edge gets an address by DHCP, resolves the PnP Connect service and is redirected to its Validator. Without DNS or internet access, it needs a bootstrap file instead."},

{g:3,t:"3.1",p:"In the Plug and Play Connect portal, which object sends a new SD-WAN edge to the correct overlay?",
o:["The controller profile, which holds the Validator address and the organization name","The device's Smart License, which encodes the overlay's address","A device template, which the portal copies to the edge","The edge's DHCP option 43, which the portal sets for the site"],
e:"Devices are assigned a controller profile in PnP Connect, which redirects them to the Validator. The organization name in it has to match the overlay's certificates."},

// ---------- 3.2 Python and the Manager API (14) ----------
{g:3,t:"3.2",y:"o",p:"Put the steps of a script that changes configuration through SD-WAN Manager in order.",
s:["GET /dataservice/client/token for the XSRF token","GET /logout to end the session","POST credentials to /j_security_check","Send the change with the session cookie and the X-XSRF-TOKEN header"],
o:["3, 1, 4, 2","1, 3, 4, 2","3, 4, 1, 2","3, 1, 2, 4"],
e:"The token is tied to a logged-in session, writes need both the cookie and the token, and logging out frees the session."},

{g:3,t:"3.2",p:"How can a script tell that its POST to /j_security_check failed?",
o:["The response body isn't empty (it's the HTML login page), and no new session cookie was set","The response status is 401 Unauthorized","The response status is 403 Forbidden","The response is JSON with an error field, and SD-WAN Manager clears the session cookie"],
e:"j_security_check returns 200 either way. A successful login has an empty body and sets JSESSIONID, while a failure returns the login page again."},

{g:3,t:"3.2",p:"Which line fills the blank?",
c:`s = requests.Session()
s.verify = "manager-ca.pem"
s.post(f"{base}/j_security_check",
       data={"j_username": user, "j_password": pw})
s.headers["X-XSRF-TOKEN"] = ________`,
o:["s.get(f\"{base}/dataservice/client/token\").text","s.get(f\"{base}/dataservice/client/token\").json()[\"token\"]","s.cookies[\"JSESSIONID\"]","s.get(f\"{base}/dataservice/client/token\").headers[\"X-XSRF-TOKEN\"]"],
e:"The token endpoint returns the token as plain text, so .text gives it. It's different from the session cookie."},

{g:3,t:"3.2",p:"Which expression lists the WAN edges that are currently reachable?",
c:`r = s.get(f"{base}/dataservice/device")
edges = ________`,
o:["[d for d in r.json()[\"data\"] if d[\"personality\"] == \"vedge\" and d[\"reachability\"] == \"reachable\"]","[d for d in r.json()[\"data\"] if d[\"device-type\"] == \"cedge\" and d[\"reachability\"] == \"reachable\"]","[d for d in r.json()[\"response\"] if d[\"personality\"] == \"vedge\" and d[\"status\"] == \"up\"]","[d for d in r.json() if d[\"personality\"] == \"edge\" and d[\"reachability\"] == \"up\"]"],
e:"Results are under data. personality is vedge for every WAN edge, including IOS XE platforms, alongside vsmart, vbond and vmanage, and reachability is reachable or unreachable."},

{g:3,t:"3.2",p:"A script must collect BFD state from 2,000 edges every five minutes. Why is calling /dataservice/device/bfd/sessions for each edge a poor design?",
o:["Real-time device APIs query each device live through the Manager, which is slow and puts load on the Manager and the edges","Real-time APIs only work for Controllers, not for WAN edges","Real-time APIs return cached data that's refreshed only once an hour, so polling every five minutes gains nothing at all","Real-time APIs need a separate login for each device"],
e:"Real-time endpoints fetch live state from the device for each call. For fleet-wide monitoring, use stored statistics, alarms and aggregation queries."},

{g:3,t:"3.2",p:"What does POST /dataservice/template/device/config/attachfeature return when it's accepted?",
o:["An id for the push action, polled at /dataservice/device/action/status/{id}","The device's new running configuration","201 Created with the device template in the body","A list of variables that are still missing"],
e:"Template pushes are asynchronous device actions. The status endpoint reports progress and errors for each device. Missing variables are checked beforehand, with config/input or during validation."},

{g:3,t:"3.2",p:"In the attachfeature body, which keys identify the device a template is pushed to?",
o:["csv-deviceId (the device's UUID or chassis number) and csv-deviceIP (its system IP)","csv-host-name and csv-site-id","deviceSerial and managementIp","//system/host-name and //system/system-ip, which the push matches against the WAN edge list"],
e:"csv-deviceId and csv-deviceIP identify the target. Keys such as //system/host-name are template variable values, and csv-host-name is a label."},

{g:3,t:"3.2",p:"Activating a centralized policy through the API fails, saying a Controller isn't in vManage mode. What's needed first?",
o:["Attach a device template to the Controllers, so SD-WAN Manager manages their configuration","Reboot the Controllers, so they come back in vManage mode and reload their policy from SD-WAN Manager","Activate the policy on the Validators first","Add the Controllers to the WAN edge list"],
e:"SD-WAN Manager can only push centralized policy to Controllers whose configuration it manages, which is vManage mode, set by attaching a template."},

{g:3,t:"3.2",p:"What does create_manager_session in the catalystwan Python SDK take care of?",
c:`from catalystwan.session import create_manager_session

with create_manager_session(url="manager.example.com",
                            username=user, password=pw) as session:
    devices = session.api.devices.get()`,
o:["Logging in, handling the XSRF token and session cookie, and logging out when the block ends","Logging in only; the script must still add the XSRF token to every request","Opening NETCONF sessions to each device listed in SD-WAN Manager","Downloading the WAN edge list from Plug and Play Connect"],
e:"The SDK wraps the authentication flow and session handling, and gives typed access to endpoints through session.api."},

{g:3,t:"3.2",p:"Which body asks a statistics endpoint, such as /dataservice/statistics/approute, for the last hour of data?",
o:["{\"query\": {\"condition\": \"AND\", \"rules\": [{\"value\": [\"1\"], \"field\": \"entry_time\", \"type\": \"date\", \"operator\": \"last_n_hours\"}]}}",
"{\"query\": {\"condition\": \"AND\", \"rules\": [{\"value\": 1, \"field\": \"entry_time\", \"type\": \"date\", \"operator\": \"last_hours\"}]}}",
"{\"timespan\": 3600, \"fields\": [\"loss_percentage\", \"latency\", \"jitter\"]}",
"{\"query\": {\"rules\": [{\"value\": [\"1h\"], \"field\": \"timestamp\", \"type\": \"time\", \"operator\": \"since\"}]}}"],
e:"Statistics queries are rule lists, like a query builder: the field is entry_time, the type is date, the operator is last_n_hours and the value is a list of strings."},

{g:3,t:"3.2",p:"A statistics query returns pageInfo with hasMoreData: true. How does the script get the rest?",
o:["Call the endpoint's /page variant with the scrollId from pageInfo until hasMoreData is false","Repeat the same query, which returns the next page each time","Raise the size parameter above the maximum, which makes the statistics endpoint return everything in one response","Follow the Link header with rel=next"],
e:"Statistics results are paged with a scroll ID. Repeating the query starts from the beginning again, and Link headers are how Meraki pages."},

{g:3,t:"3.2",p:"Which real-time API shows the routes one WAN edge has learned from the Controllers?",
o:["GET /dataservice/device/omp/routes/received?deviceId=<system-ip>","GET /dataservice/device/bfd/sessions?deviceId=<system-ip>","GET /dataservice/device/control/connections?deviceId=<system-ip>","GET /dataservice/template/policy/vsmart"],
e:"Edges learn routes over OMP from the Controllers. BFD sessions show the data plane, control connections show peerings, and the policy endpoint lists centralized policies."},

{g:3,t:"3.2",p:"A report must list every authorized WAN edge, including ones that have never joined, with its certificate status. Which API fits?",
o:["GET /dataservice/system/device/vedges","GET /dataservice/device","GET /dataservice/device/control/connections","GET /dataservice/template/device"],
e:"system/device/vedges reads the WAN edge list itself, with chassis numbers and validity. /dataservice/device only shows devices that have joined."},

{g:3,t:"3.2",p:"Which request lists the device templates and how many devices each is attached to?",
o:["GET /dataservice/template/device","GET /dataservice/template/feature","GET /dataservice/device?template=true","GET /dataservice/template/policy/list"],
e:"The device template list includes devicesAttached for each template. Feature templates are the building blocks, and policy lists hold groups such as sites and VPNs."},

// ---------- 3.3 Jinja2 (2) ----------
{g:3,t:"3.3",p:"site = {\"code\": \"akl\", \"n\": 3}. What does this line render?",
c:`"//system/host-name": "{{ '%s-edge%02d' | format(site.code | upper, site.n) }}"`,
o:["\"//system/host-name\": \"AKL-edge03\"","\"//system/host-name\": \"akl-edge3\"","\"//system/host-name\": \"AKL-edge3\"","\"//system/host-name\": \"akl-EDGE03\""],
e:"format applies printf-style formatting: %s takes the upper-cased code, and %02d pads the number to two digits."},

{g:3,t:"3.3",p:"Which lines does this CLI add-on template render for a site with mpls: false?",
c:`{% if site.mpls %}
sdwan
 interface GigabitEthernet0/0/1
  tunnel-interface
   color mpls restrict
{% endif %}
sdwan
 interface GigabitEthernet0/0/0
  tunnel-interface
   color biz-internet`,
o:["Only the GigabitEthernet0/0/0 block with color biz-internet","Both blocks, with the MPLS block commented out","Both blocks, because if only skips the first line","Nothing, because the if block fails"],
e:"The if block renders nothing when the condition is false, so only the internet TLOC is configured."},

// ---------- 3.4 Ansible (4) ----------
{g:3,t:"3.4",p:"Which expression gives the XSRF token from this task's result?",
c:`- name: Get the XSRF token
  ansible.builtin.uri:
    url: "https://{{ manager }}/dataservice/client/token"
    headers:
      Cookie: "{{ login.cookies_string }}"
    return_content: true
  register: tok`,
o:["{{ tok.content }}","{{ tok.json.token }}","{{ tok.cookies.XSRF }}","{{ tok.headers['X-XSRF-TOKEN'] }}"],
e:"The token is returned as plain text, so it's in content. There's no JSON body to parse."},

{g:3,t:"3.4",p:"The login task reports success even with a wrong password. Which line makes it fail correctly?",
c:`- name: Log in to SD-WAN Manager
  ansible.builtin.uri:
    url: "https://{{ manager }}/j_security_check"
    method: POST
    body_format: form-urlencoded
    body: {j_username: "{{ user }}", j_password: "{{ pw }}"}
    return_content: true
  register: login
  ________`,
o:["failed_when: login.content | length > 0","failed_when: login.status != 200","status_code: [200, 401]","ignore_errors: false"],
e:"A failed login still returns 200, with the login page in the body. A successful one returns an empty body."},

{g:3,t:"3.4",p:"Which condition makes this task wait until a template push has finished?",
c:`- name: Wait for the push
  ansible.builtin.uri:
    url: "https://{{ manager }}/dataservice/device/action/status/{{ push.json.id }}"
    headers: {Cookie: "{{ login.cookies_string }}"}
  register: st
  until: ________
  retries: 30
  delay: 10`,
o:["st.json.summary.status == \"done\"","st.status == 200","st.json.data | length > 0","st.json.summary.status == \"in_progress\""],
e:"The action's summary status moves from in_progress to done. A 200 only means the status call worked, so check summary.count for failures afterwards."},

{g:3,t:"3.4",p:"A play runs against 50 WAN edges, but every API call must go to SD-WAN Manager, using each edge's own variables. What fits?",
o:["Run the uri tasks with delegate_to: localhost, so each call uses that edge's variables","Use connection: network_cli, so Ansible configures each edge directly","Use run_once: true, so a single call covers every edge","Use connection: netconf to each edge, which then relays the calls to SD-WAN Manager on the play's behalf"],
e:"Delegation runs each task on the control node while keeping the current host's variables. Configuring edges directly would put them out of sync with SD-WAN Manager."},

// ---------- 3.5 Security, policy and segmentation (8) ----------
{g:3,t:"3.5",p:"Guest traffic in VPN 20 must leave each branch straight to the internet, while corporate VPNs still use the overlay. Which policy action fits?",
o:["A centralized data policy for VPN 20 with the action nat use-vpn 0","A control policy that removes VPN 20's routes from OMP","A localized ACL that permits guest traffic out of VPN 512","An app-aware routing policy that prefers the biz-internet color for VPN 20"],
e:"nat use-vpn 0 sends matched traffic out of the transport VPN with NAT, which gives direct internet access. App-aware routing only chooses between overlay tunnels."},

{g:3,t:"3.5",p:"Some sites must not take part in the PCI VPN at all. Which centralized policy type limits which sites receive a VPN's routes?",
o:["A VPN membership policy","An app-aware routing policy","A cflowd policy","A localized QoS policy"],
e:"VPN membership policies, applied on the Controllers, decide which sites can join which VPNs. App-aware routing chooses paths, and cflowd exports flow records."},

{g:3,t:"3.5",p:"In SD-WAN's zone-based firewall on IOS XE edges, what are zones built from?",
o:["VPNs, so a zone pair controls traffic between segments","Colors, so a zone pair controls traffic between transports","Site IDs, so a zone pair controls traffic between sites","Device templates, so a zone pair controls traffic between models"],
e:"Zones group service VPNs (and, in newer releases, interfaces). Firewall policies are applied to zone pairs, such as Guest to Corporate."},

{g:3,t:"3.5",p:"A security policy with URL filtering fails to deploy to a Catalyst 8300. What's the likely cause?",
o:["The UTD security virtual image isn't in the repository or installed on the device","URL filtering only works on Controllers","The device must be in CLI mode for security policies","URL filtering needs a centralized data policy activated on the Controllers, not a security policy on the device"],
e:"URL filtering and IPS run in the UTD container on IOS XE edges. The matching image must be uploaded to SD-WAN Manager and installed on the device."},

{g:3,t:"3.5",p:"Edge A has an mpls TLOC configured with restrict and a biz-internet TLOC. Remote edge B has only biz-internet. Which tunnels form between them?",
o:["Only biz-internet to biz-internet","Both A's mpls and A's biz-internet to B's biz-internet","Only A's mpls to B's biz-internet","None, because restrict blocks every tunnel from A"],
e:"restrict limits a color to tunnels with the same color, so A's mpls TLOC won't pair with B's biz-internet. Without restrict, it would try to."},

{g:3,t:"3.5",p:"Where is a centralized data policy enforced?",
o:["On the WAN edges, after SD-WAN Manager activates it on the Controllers, which send it to the edges over OMP","On the Controllers, which inspect user traffic as it crosses the overlay and drop or redirect it according to the policy","On SD-WAN Manager, which proxies the affected traffic","On the Validators, during authentication"],
e:"Controllers hold centralized policy. Control policies take effect on the Controllers themselves, while data and app-route policies are sent to the edges, which enforce them."},

{g:3,t:"3.5",p:"Branch traffic to the internet in VPN 10 must be inspected by a firewall at the data center hub first. Which centralized data policy action fits?",
o:["service FW, with the hub advertising the firewall service into OMP","nat use-vpn 0 at each branch","set tloc-list to the hub's TLOCs, so the traffic is routed to the data center without a service","drop at the hub, with a log action"],
e:"Service chaining redirects matched traffic to a service, such as FW, that a hub advertises. nat use-vpn 0 would bypass the firewall."},

{g:3,t:"3.5",p:"Users in VPN 10 and guests in VPN 20 share one branch edge. What keeps their routes apart across the overlay?",
o:["Each service VPN has its own routing table, and OMP carries routes tagged with their VPN","A localized ACL on each LAN interface","Different colors for each VPN","Separate site IDs for each VPN on the same edge, so OMP treats the segments as different locations"],
e:"Service VPNs are separate VRFs, so segmentation is kept end to end. Colors describe transports, and site IDs describe locations."},

// ---------- 3.6 Troubleshooting (7) ----------
{g:3,t:"3.6",y:"x",p:"Match each control connection error from show sdwan control connection-history with its cause.",
s:["CTORGNMMIS","BIDNTVRFD","DCONFAIL","SERNTPRES"],
r:["The DTLS connection couldn't be established, for example because a firewall blocks it","The certificate's organization name doesn't match the overlay's","The device's serial number isn't in the Controllers' list","The chassis or board ID hasn't been verified against the WAN edge list"],
o:["1-b, 2-d, 3-a, 4-c","1-b, 2-c, 3-a, 4-d","1-d, 2-b, 3-a, 4-c","1-b, 2-d, 3-c, 4-a"],
e:"These codes show where onboarding fails. Organization name mismatches and allow-list problems point to Manager settings, and DCONFAIL points to reachability on UDP 12346 and nearby ports."},

{g:3,t:"3.6",p:"A script logs in with one requests session, but takes the XSRF token from a second session. Every POST returns 403. Why?",
o:["The XSRF token is tied to the session that requested it, so it doesn't match the cookie being sent","The token expires as soon as it's read","POST requests need the XSRF token in the JSON body as xsrfToken, not in a request header, as SD-WAN Manager requires for writes","The second login logged the first session out"],
e:"The token and the JSESSIONID must come from the same session. Use one requests.Session for login, token and calls."},

{g:3,t:"3.6",p:"A long-running collector works for a while, then r.json() starts raising JSONDecodeError with status 200. What should it do?",
o:["Detect the HTML login page, log in again and refresh the XSRF token, then retry","Increase the request timeout","Switch to the statistics API, which never times out","Add Accept: application/json to every request, which stops SD-WAN Manager sending HTML in replies"],
e:"An expired session returns the login page instead of JSON. Collectors should check the content type or body, and log in again when that happens."},

{g:3,t:"3.6",p:"Two WAN edges at the same branch have control connections up, but no BFD session between them. Why?",
o:["They share a site ID, and edges with the same site ID don't build tunnels to each other","Their system IPs are in the same subnet","BFD is disabled by default on local links","They need different organization names, because edges in one organization never tunnel to each other locally"],
e:"This behavior is by design. Edges at one site reach each other over the LAN, or through a TLOC extension, not the overlay."},

{g:3,t:"3.6",p:"Two branches are both behind symmetric NAT. Their control connections are up, but they never form a direct BFD tunnel. What's the fix?",
o:["Give one side a static or full-cone NAT mapping, or send that traffic through a hub","Change both sites to the same site ID","Turn off BFD on both edges, so the IPsec tunnel comes up without waiting for probes to succeed through the NAT","Use the mpls color with restrict on both"],
e:"The Validator learns each edge's public mapping, but symmetric NAT changes it for each destination, so the peers can't reach each other directly. One easier side, or hub routing, solves it."},

{g:3,t:"3.6",p:"A new edge's control connections fail with certificate errors that say the certificate isn't valid yet. What should be checked first?",
o:["The edge's clock, and NTP, because certificates are checked against the current time","The organization name in the controller profile, which must match the certificate before it's valid","The edge's site ID","The color on the tunnel interface"],
e:"A clock far in the past makes valid certificates look as if they're not yet valid. Organization mismatches give their own error."},

{g:3,t:"3.6",p:"An engineer changes an edge's configuration from its CLI, and the change disappears after the next template push. Why?",
o:["The edge is in vManage mode, so its configuration comes from the template and local changes are overwritten","The CLI change wasn't saved with write memory","Template pushes reload the device, which discards any changes that weren't saved to startup with write memory beforehand","CLI changes are only kept on Controllers"],
e:"Attaching a template puts the device in vManage mode, and SD-WAN Manager becomes the source of truth. Change the template, or its variables, instead."},

// ---------- 4.1 Testing and validation (2) ----------
{g:4,t:"4.1",p:"Before activating a new app-aware routing policy, a team wants to know which path a given application flow from one edge would take. Which SD-WAN Manager tool fits?",
o:["Simulate Flows, which predicts the path and policy outcome for a defined flow","Packet capture on the edge's WAN interface, filtered on the application's traffic","The alarms list for that site","Ping from the edge to the remote system IP"],
e:"Simulate Flows evaluates routing and policy for a source, destination and application without sending traffic. Capture and ping only show real traffic."},

{g:4,t:"4.1",p:"After a change, a team needs to trace real user flows across the fabric, with per-hop path, loss and latency details. Which feature fits?",
o:["Network-Wide Path Insight (NWPI)","Simulate Flows","The WAN edge list","Software repository"],
e:"NWPI traces live flows end to end, recording the path, policy decisions and performance at each hop. Simulate Flows predicts and doesn't trace."},

// ---------- 4.3 Software (4) ----------
{g:4,t:"4.3",y:"x",p:"Match each device action endpoint with what it does.",
s:["/dataservice/device/action/install","/dataservice/device/action/changepartition","/dataservice/device/action/defaultpartition","/dataservice/device/action/removepartition"],
r:["Sets the version to keep after a software reset","Deletes an unused software version from the device","Installs (upgrades to) a new version","Activates an installed version, rebooting into it"],
o:["1-c, 2-d, 3-a, 4-b","1-d, 2-c, 3-a, 4-b","1-c, 2-a, 3-d, 4-b","1-c, 2-d, 3-b, 4-a"],
e:"Upgrades are install, then activate, and optionally set default. Each call returns an action id that's polled at /dataservice/device/action/status/{id}."},

{g:4,t:"4.3",p:"An upgrade is installed with \"activate and reboot\" left off. What's the result?",
o:["The new image is installed alongside the current one, and the edge keeps running the old version until it's activated","The edge reboots into the new version at the next maintenance window automatically, because SD-WAN Manager schedules the activation for it","The new image is discarded after installation","The edge runs the new version without a reboot"],
e:"Installing first and activating later lets you stage images ahead of a change window."},

{g:4,t:"4.3",p:"A newly activated version can't reach SD-WAN Manager after the reboot. What happens if nobody intervenes?",
o:["The edge rolls back to the previous version when the upgrade confirm timer expires","The edge keeps retrying with the new version indefinitely, until someone fixes the transport","SD-WAN Manager pushes the old image to the edge again","The Validator blocks the edge until it's re-onboarded"],
e:"After activation, the edge must re-establish control with SD-WAN Manager within the upgrade confirm time (12 minutes by default), or it reverts, which protects against a bad upgrade cutting off a site."},

{g:4,t:"4.3",p:"Hundreds of edges will be upgraded, and the image is large. Where can SD-WAN Manager tell the edges to download it from, instead of itself?",
o:["A remote server, such as HTTP or FTP, registered in the software repository","The Validator, which caches images for the edges","The Controllers, which share images over OMP","Plug and Play Connect, which hosts the images for each device"],
e:"The repository can point to remote servers, so edges download from somewhere close and SD-WAN Manager isn't the bottleneck."},

// ---------- 4.4 Health monitoring (6) ----------
{g:4,t:"4.4",p:"With app-route poll-interval at its default of 600000 ms and multiplier 6, over what window are loss, latency and jitter averaged for SLA decisions?",
o:["60 minutes","10 minutes","6 minutes","1 minute"],
e:"Each poll interval is 10 minutes, and the multiplier sets how many intervals are averaged, so the window is 60 minutes. Shorter intervals make policy react faster."},

{g:4,t:"4.4",p:"Which peers does a healthy WAN edge normally keep control connections to?",
o:["SD-WAN Manager and the Controllers; the Validator connection is only temporary","Only the Validator","Every other WAN edge in the overlay, so that it can exchange routes with them directly","Only SD-WAN Manager"],
e:"Edges connect to the Validator to be onboarded and to find the other controllers, then keep connections to SD-WAN Manager and the Controllers. Data plane tunnels to other edges use BFD, not control connections."},

{g:4,t:"4.4",p:"A script must fetch active critical alarms raised in the last hour. Which request fits?",
o:["POST /dataservice/alarms with query rules for entry_time last_n_hours 1, severity Critical and active true","GET /dataservice/device?severity=critical","GET /dataservice/event/critical","GET /dataservice/statistics/approute with a severity filter and a time range covering the last 60 minutes of alarms"],
e:"Alarms take the same rule-based query as statistics. Devices and app-route statistics have no alarm severity."},

{g:4,t:"4.4",p:"A WAN edge shows unreachable in SD-WAN Manager, yet users at the site are fine and its BFD sessions are up. What does this suggest?",
o:["The edge has lost its control connection to SD-WAN Manager, but the data plane still works","The edge is powered off","Every tunnel at the site is down, and the users are only working because of cached sessions","The edge is in CLI mode"],
e:"The control plane and data plane are separate. Edges keep forwarding on their existing tunnels and policies while the Manager connection is down."},

{g:4,t:"4.4",p:"What does Cloud OnRamp for SaaS measure to pick the best path to applications such as Microsoft 365?",
o:["Loss and latency to the SaaS application over each available path, combined into a quality score","The bandwidth each user consumes on the SaaS application, which it balances across the available paths","The SaaS provider's internal server health","DNS response times on the LAN only"],
e:"It probes the application over each local exit and gateway, and steers traffic to the path with the best score."},

{g:4,t:"4.4",p:"A report must show each edge interface's transmit and receive rate over the past day. Which approach fits?",
o:["POST a query with a time range to /dataservice/statistics/interface","Call the real-time /dataservice/device/interface for each edge every minute for a day","GET /dataservice/system/device/vedges","GET /dataservice/template/device"],
e:"Interface statistics are stored by SD-WAN Manager, so one query covers the whole period. Real-time calls only show the current counters."},

// ---------- 4.6 Webhooks (2) ----------
{g:4,t:"4.6",p:"How is SD-WAN Manager set up to POST alarms to an external HTTPS receiver?",
o:["Enable alarm notifications in Administration settings, then create a notification rule with the alarm types, severities and webhook URL","Attach a device template that points each edge at the receiver, so every edge posts its own alarms to the webhook URL using its system IP as the source","Create an event subscription in Catalyst Center","Open a NETCONF notification stream from the receiver"],
e:"Alarm notification rules decide which alarms are sent and where, by email or webhook. The edges don't post to receivers themselves."},

{g:4,t:"4.6",y:"m",p:"An SD-WAN Manager webhook receiver sometimes gets the same alarm twice, and takes several seconds to process each one. Which two changes help? (Choose two.)",
o:["Reply 2xx at once and process each alarm from a queue","De-duplicate alarms by their unique ID","Return 500 so SD-WAN Manager stops resending","Switch to plain HTTP to speed up delivery","Ask for alarms once a day in one batch"],
e:"Senders retry slow or failed deliveries, which causes duplicates. Acknowledge quickly, and make processing idempotent by alarm ID."},

// ---------- 5.1 AI (2) ----------
{g:5,t:"5.1",p:"What do predictive path recommendations, such as ThousandEyes WAN Insights, provide for Catalyst SD-WAN?",
o:["ML forecasts of path quality for each site and application, with suggested app-aware routing changes","Automatic replacement of failed WAN circuits","A real-time packet capture on every tunnel","Configuration templates generated for new sites, based on what similar sites in the overlay already use"],
e:"Using long-term telemetry, they predict which path will perform best and recommend policy changes, which engineers review before applying."},

{g:5,t:"5.1",p:"Why are predictive path recommendations unreliable for a site that joined last week?",
o:["The models need weeks of history to learn each path's patterns","They only work for sites with MPLS circuits","Recommendations are produced once a year","New sites are excluded until their edges are upgraded"],
e:"Forecasts depend on history, such as daily and weekly cycles. With little data, recommendations are weak or missing."}
];
