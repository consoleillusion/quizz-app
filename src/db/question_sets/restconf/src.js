// RESTCONF and requests topic set (exam difficulty). requests 2.34 / urllib3 2.8 behavior checked against the libraries; trees from pyang. Correct option(s) first; shuffle reorders.
const TREE_NET = `module: example-net
  +--rw routing
  |  +--rw route* [prefix next-hop]
  |     +--rw prefix      string
  |     +--rw next-hop    string
  |     +--rw distance?   uint8
  +--rw system
  |  +--rw hostname?   string
  |  +--rw dns
  |     +--rw domain?   string
  |     +--rw server*   string
  +--rw mgmt
  |  +--rw (method)?
  |  |  +--:(static)
  |  |  |  +--rw ip?              string
  |  |  |  +--rw prefix-length?   uint8
  |  |  +--:(dynamic)
  |  |     +--rw dhcp?            empty
  |  +--ro stats
  |     +--ro in-octets?    uint64
  |     +--ro out-octets?   uint64`;
const TREE_IF = `module: ietf-interfaces
  +--rw interfaces
     +--rw interface* [name]
        +--rw name                        string
        +--rw description?                string
        +--rw type                        identityref
        +--rw enabled?                    boolean
        +--ro oper-status                 enumeration
        ...
        +--rw ip:ipv4!
        |  +--rw ip:enabled?      boolean
        |  +--rw ip:forwarding?   boolean
        |  +--rw ip:mtu?          uint16
        |  +--rw ip:address* [ip]
        |  |  +--rw ip:ip                     inet:ipv4-address-no-zone
        |  |  +--rw (ip:subnet)
        |  |  |  +--:(ip:prefix-length)
        |  |  |  |  +--rw ip:prefix-length?   uint8
        |  |  |  +--:(ip:netmask)
        |  |  |     +--rw ip:netmask?         yang:dotted-quad
        ...`;
const SESSION = `s = requests.Session()
s.auth = ("netops", password)
s.headers.update({"Accept": "application/yang-data+json",
                  "Content-Type": "application/yang-data+json"})
s.verify = "lab-ca.pem"
base = "https://10.10.20.48/restconf/data"`;

module.exports = [
// ---------- 1.2 RESTCONF protocol (12) ----------
{g:1,t:"1.2",y:"x",p:"Match each GET query parameter with its effect.",
s:["content=nonconfig","depth=2","fields=interface(name;enabled)","with-defaults=report-all"],
r:["Returns only the named descendants of the target","Returns the target and its direct children, but nothing deeper","Returns only state data, without configuration","Also returns leaves that are still at their YANG default"],
o:["1-c, 2-b, 3-a, 4-d","1-c, 2-a, 3-b, 4-d","1-d, 2-b, 3-a, 4-c","1-a, 2-b, 3-c, 4-d"],
e:"content takes config, nonconfig or all (the default). depth counts the target as level 1. fields picks descendants, with ; separating them and parentheses grouping a node's children. with-defaults=report-all adds default leaves that the server would otherwise leave out."},

{g:1,t:"1.2",p:"Which request runs the ping RPC?",
c:`module: example-net
  ...
  rpcs:
    +---x ping
       +---w input
       |  +---w destination    string
       |  +---w count?         uint8
       +--ro output
          +--ro success-rate?   uint8`,
o:["POST /restconf/operations/example-net:ping","POST /restconf/data/example-net:ping","GET /restconf/operations/example-net:ping?destination=10.1.1.1","PUT /restconf/operations/example-net:ping"],
e:"RPCs are invoked with POST under /restconf/operations, with any input in an example-net:input body. Actions, which belong to a data node, are POSTed to that node's URL under /restconf/data. A GET on an operation resource returns 405."},

{g:1,t:"1.2",p:"Loopback99 doesn't exist yet. What does this request do?",
c:`PATCH /restconf/data/ietf-interfaces:interfaces/interface=Loopback99
Content-Type: application/yang-data+json

{"ietf-interfaces:interface": [{"name": "Loopback99",
  "type": "iana-if-type:softwareLoopback", "description": "TEST"}]}`,
o:["It fails, because PATCH never creates its target. A PATCH to the interfaces container could create the entry.","It creates Loopback99, because PATCH merges the body into the datastore whether or not the target already exists","It creates Loopback99 and returns 201 Created with the new entry's URL in a Location header","It fails with 409 Conflict, because PATCH can only change leaves that already hold a value"],
e:"RFC 8040 says that if the PATCH target doesn't exist, the server must not create it. Merging into a parent that does exist can create children, so PATCH the interfaces container, or use PUT or POST."},

{g:1,t:"1.2",y:"m",p:"Which two statements about RESTCONF PUT are true? (Choose two.)",
o:["If the target doesn't exist, PUT creates it","insert and point can position a new entry in an ordered-by user list","Sending a different key value in the body renames the list entry","It returns 409 Conflict when the target resource already exists","It merges the body into the target, keeping child nodes the body leaves out"],
e:"PUT creates or replaces its target. Like POST, it accepts insert and point for ordered-by user lists. It can't change keys: a body key that differs from the URL is a 400 error. 409 for an existing resource is POST behavior, and merging is PATCH."},

{g:1,t:"1.2",p:"A client sends OPTIONS to a RESTCONF data resource. Which response header lists the methods it can use there?",
o:["Allow","Accept-Patch","Access-Control-Allow-Methods","Content-Type"],
e:"Allow lists the methods, such as GET, HEAD, OPTIONS, POST, PUT, PATCH and DELETE. Accept-Patch, which RFC 8040 also requires in the OPTIONS response, lists the media types PATCH accepts, not the methods. Access-Control-Allow-Methods is a CORS header for browsers."},

{g:1,t:"1.2",p:"A script must check whether Loopback50 exists on hundreds of switches without downloading its configuration. Which request fits?",
o:["HEAD on the entry's URL: same status as a GET, 200 or 404, but no body","OPTIONS on the entry's URL, which returns 404 if missing and its leaf names if present","GET on the entry's URL with depth=0, which returns the status code and an empty body","POST to the entry's URL with an empty body, which returns 409 Conflict if it exists"],
e:"HEAD must behave exactly like GET without the message body, so the status code answers the question. depth starts at 1, and a POST risks creating data."},

{g:1,t:"1.2",p:"Before using with-defaults, a script checks whether the server supports it. Which request shows that?",
o:["GET /restconf/data/ietf-restconf-monitoring:restconf-state/capabilities","GET /.well-known/host-meta, then read the capability links it returns","GET /restconf/yang-library-version, and compare its revision date","OPTIONS /restconf/data, then look for with-defaults in the Allow header"],
e:"Optional query parameters are advertised as capability URIs, such as urn:ietf:params:restconf:capability:with-defaults:1.0, in restconf-state/capabilities. host-meta only gives the API root, and yang-library-version only gives the YANG library revision."},

{g:1,t:"1.2",p:"The rule list is ordered-by user, and ACL EDGE has rules 10, 20 and 30. The body holds rule 15. Which POST adds it directly before rule 20?",
c:`  +--rw acls
     +--rw acl* [name]
        +--rw name    string
        +--rw rule* [seq]
           +--rw seq       uint16
           +--rw action?   enumeration
           +--rw source?   string

url = base + "/example-net:acls/acl=EDGE"`,
o:[`s.post(url, json=body,
       params={"insert": "before",
               "point": "/example-net:acls/acl=EDGE/rule=20"})`,
`s.post(url, json=body,
       params={"insert": "before",
               "point": "20", "key": "seq"})`,
`s.post(url, json=body,
       params={"insert": "first",
               "point": "/example-net:acls/acl=EDGE"})`,
`s.post(url + "/rule=20", json=body,
       params={"insert": "before",
               "point": "rule=20"})`],
e:"insert takes first, last, before or after. before and after need point, which names the existing entry by its full path, not by its key alone. In an ordered-by user list, position is set by insert, not by the seq values."},

{g:1,t:"1.2",y:"o",p:"Two automation jobs edit the same NTP configuration. Put the steps in order so neither job can silently overwrite the other's change.",
s:["PUT the changed body with If-Match set to the saved value","GET the resource and save its ETag response header","Change the body locally","On 412 Precondition Failed, start again from the GET"],
o:["2, 3, 1, 4","3, 2, 1, 4","2, 1, 3, 4","2, 3, 4, 1"],
e:"The entity tag identifies the version that was read. If another client changed the resource since, the server rejects the If-Match edit with 412, and the job re-reads instead of overwriting. RESTCONF has no lock operation."},

{g:1,t:"1.2",p:"What is the smallest depth value that makes this request return every interface's name?",
c:`GET /restconf/data/ietf-interfaces:interfaces?depth=?`,
o:["3","2","1","4"],
e:"The target, interfaces, is level 1. Each interface entry is level 2, and its leaves, including name, are level 3. Nodes deeper than depth aren't returned."},

{g:1,t:"1.2",p:"In one request, a change must delete Loopback1 and create Loopback2, so that both happen or neither does. No other interface may change. Which approach fits?",
o:["A YANG Patch (application/yang-patch+json) with a delete edit and a create edit","A plain PATCH to the interfaces container, with Loopback2 in the body and Loopback1 left out","A DELETE of Loopback1, then a POST of Loopback2, on the same Session so they share a transaction","A PUT to the interfaces container, with only Loopback2 in the body"],
e:"YANG Patch (RFC 8072) carries an ordered list of edits, each with its own operation, applied as one unit. A plain PATCH only merges, so leaving Loopback1 out doesn't delete it. Separate requests are separate transactions, and PUT on the container would also remove every other interface."},

{g:1,t:"1.2",p:"Which request lists the RPCs a RESTCONF server supports?",
o:["GET /restconf/operations","GET /restconf/data?content=nonconfig","GET /restconf/data/ietf-restconf-monitoring:restconf-state/streams","OPTIONS /restconf/data"],
e:"The operations resource has one child for each RPC the server implements. content=nonconfig returns state data, the streams list is for event notifications, and OPTIONS returns methods."},

// ---------- 1.3 JSON payloads (6) ----------
{g:1,t:"1.3",p:"Which body is valid for this request?",
c:`PUT /restconf/data/Cisco-IOS-XE-native:native/hostname
Content-Type: application/yang-data+json`,
o:[`{"Cisco-IOS-XE-native:hostname": "CORE1"}`,`{"hostname": "CORE1"}`,`{"Cisco-IOS-XE-native:native": {"hostname": "CORE1"}}`,`"CORE1"`],
e:"The body represents the target itself, here the hostname leaf. As the top-level member, it needs its module name. A body wrapped in native would describe the parent, not the target."},

{g:1,t:"1.3",p:"In the native model, Loopback is a list keyed by name, a uint32. Which body creates Loopback60 with this request?",
c:`POST /restconf/data/Cisco-IOS-XE-native:native/interface
Content-Type: application/yang-data+json`,
o:[`{"Cisco-IOS-XE-native:Loopback": [{"name": 60, "description": "MGMT"}]}`,`{"Loopback": [{"name": 60, "description": "MGMT"}]}`,`{"Cisco-IOS-XE-native:interface": {"Loopback": [{"name": 60, "description": "MGMT"}]}}`,`{"Cisco-IOS-XE-native:Loopback": [{"name": "Loopback60", "description": "MGMT"}]}`],
e:"A POST body is the child being created, not the target, and its top-level member is module-qualified. The key is the loopback number, a uint32, so it's 60 rather than Loopback60."},

{g:1,t:"1.3",p:"Which response matches this request?",
c:`GET /restconf/data/ietf-interfaces:interfaces?fields=interface(name;enabled)`,
o:[`{"ietf-interfaces:interfaces": {"interface": [
  {"name": "Gi1", "enabled": true},
  {"name": "Lo0", "enabled": true}]}}`,
`{"interface": [
  {"name": "Gi1", "enabled": true},
  {"name": "Lo0", "enabled": true}]}`,
`{"ietf-interfaces:interfaces": {"interface": [
  {"name": "Gi1", "enabled": true, "type": "iana-if-type:ethernetCsmacd"},
  {"name": "Lo0", "enabled": true, "type": "iana-if-type:softwareLoopback"}]}}`,
`[{"name": "Gi1", "enabled": true},
 {"name": "Lo0", "enabled": true}]`],
e:"fields trims what comes back, but the response is still rooted at the target, interfaces, with its module-qualified name. Each entry holds only the selected leaves, so type isn't included."},

{g:1,t:"1.3",p:"The server leaf-list already holds 10.1.1.1. What does it hold after this request?",
c:`PATCH /restconf/data/example-net:system/dns

{"example-net:dns": {"server": ["10.2.2.2"]}}`,
o:["10.1.1.1 and 10.2.2.2","Only 10.2.2.2, because a leaf-list in a PATCH body replaces the whole leaf-list","Only 10.1.1.1, because a PATCH can't add new values to an existing leaf-list","Nothing changes, and the server returns an error, because leaf-list values go one per request"],
e:"A plain PATCH merges. For a leaf-list, merging adds the values in the body and keeps the rest. To replace them all, PUT the dns container. To remove one value, DELETE .../dns/server=10.1.1.1."},

{g:1,t:"1.3",p:"Loopback5 has an empty ipv4 container. Which body adds 10.5.5.5/32 with this request?",
c:TREE_IF+`

POST /restconf/data/ietf-interfaces:interfaces/interface=Loopback5/ietf-ip:ipv4`,
o:[`{"ietf-ip:address": [{"ip": "10.5.5.5", "prefix-length": 32}]}`,`{"address": [{"ip": "10.5.5.5", "prefix-length": 32}]}`,`{"ietf-interfaces:address": [{"ip": "10.5.5.5", "prefix-length": 32}]}`,`{"ietf-ip:address": [{"ip": "10.5.5.5", "subnet": {"prefix-length": 32}}]}`],
e:"The body's top-level member is always module-qualified, and address belongs to ietf-ip. Its children are in the same module, so they aren't qualified. Choice and case names, like subnet, never appear in data."},

{g:1,t:"1.3",y:"g",p:"Fill the gaps so this request sets the administrative distance of the route to 10.0.0.0/8 via 192.0.2.1 to 200.",
c:TREE_NET+`

PATCH /restconf/data/example-net:⟦1⟧
{"⟦2⟧": {"⟦3⟧": [{"prefix": "10.0.0.0/8",
                   "next-hop": "192.0.2.1",
                   "distance": ⟦4⟧}]}}`,
bank:["routing","route","example-net:routing","example-net:route","200",`"200"`,"[200]","10.0.0.0%2F8"],
a:["routing","example-net:routing","route","200"],
e:"The target is routing, so the body starts with it, module-qualified. route is a list, so its entries go in an array, and key values in a body are plain strings: %2F encoding is only for URLs. distance is a uint8, so it's a JSON number."},

// ---------- 1.4 XML payloads (3) ----------
{g:1,t:"1.4",p:"Which body creates Loopback61 with this request?",
c:`POST /restconf/data/Cisco-IOS-XE-native:native/interface
Content-Type: application/yang-data+xml`,
o:[`<Loopback xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
  <name>61</name>
</Loopback>`,
`<Loopback xmlns="Cisco-IOS-XE-native">
  <name>61</name>
</Loopback>`,
`<config>
  <Loopback xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
    <name>61</name>
  </Loopback>
</config>`,
`<Cisco-IOS-XE-native:Loopback>
  <name>61</name>
</Cisco-IOS-XE-native:Loopback>`],
e:"In XML, the module is identified by its namespace URI in xmlns, not by its name. RESTCONF bodies have no <config> wrapper; that belongs to NETCONF's edit-config. The module-name: form is JSON only."},

{g:1,t:"1.4",p:"The request was sent with Accept: application/yang-data+xml. Which expression returns MGMT?",
c:`# r.text
<interface xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
  <name>Loopback5</name>
  <description>MGMT</description>
</interface>

import xml.etree.ElementTree as ET
root = ET.fromstring(r.text)`,
o:[`root.find("{urn:ietf:params:xml:ns:yang:ietf-interfaces}description").text`,`root.find("description", namespaces={"if": "urn:ietf:params:xml:ns:yang:ietf-interfaces"}).text`,`root.find("{ietf-interfaces}description").text`,`root.find("interface/description").text`],
e:"The default namespace applies to every child, so find needs {uri}name, using the namespace URI, not the module name. A namespaces= map only helps if the path uses its prefix, as in if:description. A bare name only matches elements with no namespace, and root is already the interface element."},

{g:1,t:"1.4",p:"Which body sets Loopback5's IPv4 MTU to 1400 with this request?",
c:`PATCH /restconf/data/ietf-interfaces:interfaces/interface=Loopback5
Content-Type: application/yang-data+xml`,
o:[`<interface xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
  <name>Loopback5</name>
  <ipv4 xmlns="urn:ietf:params:xml:ns:yang:ietf-ip">
    <mtu>1400</mtu>
  </ipv4>
</interface>`,
`<interface xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
  <name>Loopback5</name>
  <ipv4>
    <mtu>1400</mtu>
  </ipv4>
</interface>`,
`<interface xmlns="urn:ietf:params:xml:ns:yang:ietf-ip">
  <name>Loopback5</name>
  <ipv4>
    <mtu>1400</mtu>
  </ipv4>
</interface>`,
`<ipv4 xmlns="urn:ietf:params:xml:ns:yang:ietf-ip">
  <mtu>1400</mtu>
</ipv4>`],
e:"The body represents the target, the interface entry, in the ietf-interfaces namespace. ipv4 comes from the ietf-ip augment, so it needs its own xmlns, which its children inherit. A bare ipv4 would be an unknown element of ietf-interfaces, and a body of just ipv4 doesn't match the target."},

// ---------- 1.5 Trees to URLs (5) ----------
{g:1,t:"1.5",p:"Which URL reads only Loopback1's IPv4 configuration and state?",
c:TREE_IF,
o:["/restconf/data/ietf-interfaces:interfaces/interface=Loopback1/ietf-ip:ipv4","/restconf/data/ietf-interfaces:interfaces/interface=Loopback1/ipv4","/restconf/data/ietf-interfaces:interfaces/interface=Loopback1/ietf-interfaces:ipv4","/restconf/data/ietf-ip:interfaces/interface=Loopback1/ipv4"],
e:"A path segment needs the module name wherever the namespace changes, as it does at the ietf-ip augment. The tree shows the prefix ip:, but URLs use module names, not prefixes."},

{g:1,t:"1.5",p:"Which URL reads only the action of rule 20 in ACL EDGE?",
c:`module: example-net
  ...
  +--rw acls
     +--rw acl* [name]
        +--rw name    string
        +--rw rule* [seq]
           +--rw seq       uint16
           +--rw action?   enumeration
           +--rw source?   string`,
o:["/restconf/data/example-net:acls/acl=EDGE/rule=20/action","/restconf/data/example-net:acls/acl/EDGE/rule/20/action","/restconf/data/example-net:acls/acl=EDGE,rule=20/action","/restconf/data/example-net:acls/acl=EDGE/rule/seq=20/action"],
e:"Each list in the path takes its key after =, as its own path segment: acl=EDGE, then rule=20. Commas only separate the values of a list with more than one key, and the key leaf's name never appears in the URL."},

{g:1,t:"1.5",p:"Which request removes only 10.1.1.1 from the DNS servers, leaving the others?",
c:TREE_NET,
o:["DELETE /restconf/data/example-net:system/dns/server=10.1.1.1","DELETE /restconf/data/example-net:system/dns/server?value=10.1.1.1",`PATCH /restconf/data/example-net:system/dns with {"example-net:dns": {"server": []}}`,"DELETE /restconf/data/example-net:system/dns/server[.='10.1.1.1']"],
e:"Each leaf-list entry is a resource identified by its value after =, like a list key. A PATCH merges, so it can't remove anything, and XPath predicates aren't valid in RESTCONF URLs."},

{g:1,t:"1.5",p:"Which request returns an error?",
c:TREE_NET,
o:[`PATCH /restconf/data/example-net:mgmt/stats with {"example-net:stats": {"in-octets": "0"}}`,"GET /restconf/data/example-net:mgmt/stats","GET /restconf/data/example-net:mgmt?content=config",`PATCH /restconf/data/example-net:mgmt with {"example-net:mgmt": {"ip": "10.9.9.9", "prefix-length": 24}}`],
e:"stats is ro (config false), so it can be read but not edited. content=config is valid and just leaves stats out. ip is a writable leaf in the static case."},

{g:1,t:"1.5",p:"Which URL reads the ip leaf?",
c:TREE_NET,
o:["/restconf/data/example-net:mgmt/ip","/restconf/data/example-net:mgmt/method/static/ip","/restconf/data/example-net:mgmt/(method)/ip","/restconf/data/example-net:mgmt/static/ip"],
e:"Choices and cases are schema nodes only. They never appear in data, so they never appear in URLs or bodies."},

// ---------- 2.3 Python requests with RESTCONF (19) ----------
{g:2,t:"2.3",y:"g",p:"Fill the gaps so the session authenticates, sends and accepts YANG JSON, trusts the lab CA, and limits how long the call waits.",
c:`s = requests.Session()
s.⟦1⟧ = ("netops", password)
s.⟦2⟧.update({"Accept": "⟦3⟧",
              "Content-Type": "⟦4⟧"})
s.⟦5⟧ = "lab-ca.pem"
r = s.get(base + "/Cisco-IOS-XE-native:native/hostname", ⟦6⟧=(5, 30))`,
bank:["auth","headers","verify","cert","timeout","params","application/yang-data+json","application/json","cookies"],
a:["auth","headers","application/yang-data+json","application/yang-data+json","verify","timeout"],
e:"auth sets basic authentication for every request, and session headers apply to every call. verify takes True, False or a CA bundle path; cert is for a client certificate. A Session has no timeout setting, so timeout goes on each call."},

{g:2,t:"2.3",y:"m",p:"The session's headers set Content-Type: application/yang-data+json. Which two calls send body as a valid JSON payload with that content type? (Choose two.)",
c:`body = {"Cisco-IOS-XE-native:hostname": "CORE1"}`,
o:["s.put(url, json=body)","s.put(url, data=json.dumps(body))","s.put(url, data=body)","s.put(url, data=str(body))","s.put(url, params=body)"],
e:"json= serializes the dict and only sets Content-Type when none is set, so the session's yang-data+json is kept. data= with a string sends it as is. data= with a dict form-encodes it, str() produces Python syntax with single quotes, and params= puts it in the query string."},

{g:2,t:"2.3",p:"This script hangs forever when a switch accepts the connection but never replies. Which change makes every call give up?",
c:`s = requests.Session()
s.timeout = 30
r = s.get(url)`,
o:["Pass timeout=(5, 30) on each call; requests ignores a timeout set on a Session","Keep s.timeout = 30, and add s.verify = True so that the TLS handshake is time-limited","Mount an HTTPAdapter with max_retries=3, which also sets a 30-second read timeout","Set s.headers[\"Keep-Alive\"] = \"timeout=30\" so the switch closes the idle connection"],
e:"requests has no default timeout, and Session has no timeout setting, so s.timeout is silently ignored. A (connect, read) tuple on each call limits both waits. Retries repeat a call; they don't limit how long it waits."},

{g:2,t:"2.3",p:"The switch at the URL doesn't answer the TCP connection. What does this print?",
c:`try:
    r = s.get(url, timeout=(5, 30))
except requests.ConnectionError:
    print("unreachable")
except requests.Timeout:
    print("too slow")`,
o:["unreachable: ConnectTimeout subclasses both, and the first matching clause runs","too slow, because a connect timeout raises Timeout, which isn't a ConnectionError","Nothing, because a connect timeout returns a Response with status code 504 instead","Both lines, because the exception matches both of the except clauses"],
e:"ConnectTimeout inherits from both ConnectionError and Timeout, and Python runs the first except clause that matches. A ReadTimeout, after the connection is made, is only a Timeout, so it would print too slow."},

{g:2,t:"2.3",p:"The POST is rejected with this body. Which expression returns object already exists?",
c:`try:
    r = s.post(url, json=body, timeout=30)
    r.raise_for_status()
except requests.HTTPError as e:
    msg = ...

# response body
{"ietf-restconf:errors": {"error": [{"error-type": "application",
  "error-tag": "data-exists", "error-message": "object already exists"}]}}`,
o:[`e.response.json()["ietf-restconf:errors"]["error"][0]["error-message"]`,`e.json()["ietf-restconf:errors"]["error"][0]["error-message"]`,`e.response.text["ietf-restconf:errors"]["error"][0]["error-message"]`,`e.response.json()["ietf-restconf:errors"]["error"]["error-message"]`],
e:"HTTPError carries the Response as e.response. The errors container is module-qualified at the top level, and error is a list, so it needs an index even when there's one error."},

{g:2,t:"2.3",p:"Lab switches use self-signed certificates, and calls fail with SSLError: certificate verify failed. Which fix keeps certificate checking?",
o:["Export the switch's certificate, or its signing CA, to a PEM file and pass that path as verify","Set verify=False, and call urllib3.disable_warnings() so the InsecureRequestWarning is hidden","Pass cert=(\"client.pem\", \"client.key\") so the switch and the script trust each other","Change the URLs to http://, since RESTCONF accepts the same basic-auth credentials over HTTP"],
e:"verify accepts a CA bundle path, so a self-signed certificate can be trusted explicitly. verify=False turns checking off, and hiding the warning doesn't change that. cert= presents a client certificate, which doesn't help the client trust the server, and RESTCONF requires HTTPS."},

{g:2,t:"2.3",p:"GETs now survive brief 503 errors, but a PATCH that gets a 503 fails at once. Why?",
c:`retry = Retry(total=4, backoff_factor=1, status_forcelist=[503])
s.mount("https://", HTTPAdapter(max_retries=retry))`,
o:["Only methods in allowed_methods are retried, and the default omits POST and PATCH","status_forcelist applies to GET only, so other methods need their own retry list","backoff_factor=1 makes the first wait longer than the PATCH timeout allows","The adapter is mounted for https:// only, and PATCH uses another connection pool"],
e:"The default allowed_methods is DELETE, GET, HEAD, OPTIONS, PUT and TRACE, because POST and PATCH aren't guaranteed to be idempotent. Add PATCH only if repeating it is safe: merging the same body usually is, but a POST that creates data isn't."},

{g:2,t:"2.3",y:"g",p:"Fill the gaps so the loop prints each interface's name and its configured state.",
c:`r = s.get(base + "/ietf-interfaces:interfaces", timeout=30)
for intf in r.⟦1⟧["⟦2⟧"]["⟦3⟧"]:
    print(intf["name"], intf["⟦4⟧"])`,
bank:["json()","text","ietf-interfaces:interfaces","interfaces","interface","ietf-interfaces:interface","enabled","oper-status"],
a:["json()","ietf-interfaces:interfaces","interface","enabled"],
e:"json() parses the body. Only the top-level member carries the module name; interface is a child in the same module. enabled is the configured state, while oper-status is whether the interface is actually up."},

{g:2,t:"2.3",y:"m",p:"A script makes 400 RESTCONF calls to one switch. Which two are benefits of a requests.Session over separate requests.get and requests.patch calls? (Choose two.)",
o:["The TCP connection and TLS session are reused, instead of a new handshake for each call","auth, headers and verify are set once on the session and apply to every call","The calls are applied as one transaction, so a failure rolls back the earlier calls","RESTCONF requires a session cookie, and only a Session object can keep it","Calls are pipelined on one connection, so the switch processes them in parallel"],
e:"A Session keeps a connection pool and default settings. It doesn't create a server-side session or transaction, and requests sends one request at a time on a connection."},

{g:2,t:"2.3",y:"g",p:"Fill the gaps so the function returns the status code for device errors, and treats every other requests failure, including timeouts, as a network problem.",
c:`def set_desc(url, body):
    try:
        r = s.patch(url, json=body, timeout=(5, 30))
        r.⟦1⟧()
    except requests.⟦2⟧ as e:
        return f"device said {e.⟦3⟧.status_code}"
    except requests.⟦4⟧:
        return "network problem"
    return "ok"`,
bank:["raise_for_status","json","HTTPError","ConnectionError","RequestException","response","request","Timeout"],
a:["raise_for_status","HTTPError","response","RequestException"],
e:"raise_for_status turns 4xx and 5xx into HTTPError, whose response attribute holds the reply. HTTPError is a RequestException too, so it must be caught first. RequestException then catches connection errors and both kinds of timeout; ConnectionError alone would miss a ReadTimeout."},

{g:2,t:"2.3",p:"A cleanup job deletes Loopback900 from every switch and must be safe to rerun. On a rerun, the switch replies 404 with error-tag invalid-value. Which check treats the run as successful?",
c:`r = s.delete(base + "/Cisco-IOS-XE-native:native/interface/Loopback=900", timeout=30)`,
o:["r.status_code in (204, 404)","r.status_code == 200","r.ok","r.status_code in (200, 201)"],
e:"A successful DELETE returns 204 No Content. On a rerun the entry is already gone, and the 404 still means the switch is in the state the job wants. r.ok is False for 404, and DELETE doesn't return 200 or 201."},

{g:2,t:"2.3",p:"Which expression returns the IOS XE version string?",
c:`r = s.get(base + "/Cisco-IOS-XE-native:native/version", timeout=30)`,
o:[`r.json()["Cisco-IOS-XE-native:version"]`,`r.json()["version"]`,`r.json()["Cisco-IOS-XE-native:native"]["version"]`,`r.text`],
e:"The reply represents the target, the version leaf, as a module-qualified top-level member. It isn't wrapped in native. r.text is the whole JSON document, not the value."},

{g:2,t:"2.3",p:"Which expression completes the URL for any route, whatever characters its keys contain?",
c:`from urllib.parse import quote
prefix, nh = "10.0.0.0/8", "192.0.2.1"
url = base + "/example-net:routing/route=" + ...`,
o:[`",".join(quote(k, safe="") for k in (prefix, nh))`,`",".join(quote(k) for k in (prefix, nh))`,`quote(prefix + "," + nh, safe="")`,`quote(prefix, safe="") + "/" + quote(nh, safe="")`],
e:"Each key value is encoded on its own with safe=\"\", so / becomes %2F and any comma inside a value becomes %2C. The separating commas stay literal. quote's default, safe=\"/\", leaves slashes alone."},

{g:2,t:"2.3",p:"A script must create Loopback1001 to Loopback1050 with as few requests as possible, without changing any other interface. Which approach works?",
o:["One PATCH to .../native/interface, with all 50 Loopback entries in the body","One POST to .../native/interface, with all 50 Loopback entries in the body","One PUT to .../native/interface, with all 50 Loopback entries in the body","One PUT to .../native/interface/Loopback=1001, with all 50 entries in the body"],
e:"PATCH merges, so a list in the body adds every entry and leaves the rest alone. A POST creates exactly one child resource. PUT on the container replaces it, removing every interface not in the body, and a PUT to one entry can only describe that entry."},

{g:2,t:"2.3",p:"A PATCH returns 400. Which attributes show exactly what requests sent?",
o:["r.request.headers and r.request.body","r.headers and r.text, which echo the request","r.raw.headers and r.raw.data","r.history[-1].headers and r.history[-1].text"],
e:"r.request is the PreparedRequest that went on the wire, including the merged headers and the serialized body. r.headers and r.text are the reply."},

{g:2,t:"2.3",p:"Which expression lists the names of interfaces that aren't up?",
c:`r = s.get(base + "/Cisco-IOS-XE-interfaces-oper:interfaces",
          params={"fields": "interface(name;oper-status)"}, timeout=30)
data = r.json()

# data
{"Cisco-IOS-XE-interfaces-oper:interfaces": {"interface": [
  {"name": "GigabitEthernet1/0/1", "oper-status": "if-oper-state-ready"},
  {"name": "GigabitEthernet1/0/2", "oper-status": "if-oper-state-no-pass"}]}}`,
o:[`[i["name"] for i in data["Cisco-IOS-XE-interfaces-oper:interfaces"]["interface"]
 if i["oper-status"] != "if-oper-state-ready"]`,
`[i["name"] for i in data["interface"]
 if i["oper-status"] != "if-oper-state-ready"]`,
`[i["name"] for i in data["Cisco-IOS-XE-interfaces-oper:interfaces"]
 if i["oper-status"] != "if-oper-state-ready"]`,
`[i["name"] for i in data["Cisco-IOS-XE-interfaces-oper:interfaces"]["interface"]
 if i["oper-status"] == "down"]`],
e:"The list sits under the module-qualified container. The model's enumeration uses if-oper-state-ready for up, so comparing with down matches nothing."},

{g:2,t:"2.3",y:"g",p:"Fill the gaps so the script runs ping to 10.1.1.1 with 3 probes and prints the success rate.",
c:`module: example-net
  rpcs:
    +---x ping
       +---w input
       |  +---w destination    string
       |  +---w count?         uint8
       +--ro output
          +--ro success-rate?   uint8

url = "https://10.10.20.48/restconf/⟦1⟧/example-net:ping"
r = s.post(url, json={"⟦2⟧": {"destination": "10.1.1.1", "count": 3}}, timeout=60)
print(r.json()["⟦3⟧"]["success-rate"])`,
bank:["operations","data","example-net:input","input","example-net:output","output","ietf-restconf:output","example-net:ping"],
a:["operations","example-net:input","example-net:output"],
e:"RPCs live under /restconf/operations. The input is wrapped in a container named input and the reply in one named output, each qualified with the RPC's module name."},

{g:2,t:"2.3",p:"Which headers does this call send?",
c:SESSION+`

r = s.get(url, headers={"Accept": "application/yang-data+xml"}, timeout=30)`,
o:["Accept: application/yang-data+xml, the session's Content-Type, and Authorization from s.auth","Only Accept: application/yang-data+xml, because headers= replaces the session headers for that call","Accept: application/yang-data+json, because session headers take priority over headers passed to a call","Both Accept values, joined into one header as a comma-separated list, plus the session's other headers"],
e:"requests merges per-call headers into the session's, and the call wins where they clash. Session auth still applies. To drop a session header for one call, set it to None."},

{g:2,t:"2.3",p:"Which body switches mgmt to DHCP when sent with s.patch(base + \"/example-net:mgmt\", json=body)?",
c:TREE_NET,
o:[`{"example-net:mgmt": {"dhcp": [None]}}`,`{"example-net:mgmt": {"dhcp": None}}`,`{"example-net:mgmt": {"dhcp": True}}`,`{"example-net:mgmt": {"dynamic": {"dhcp": [None]}}}`],
e:"An empty leaf is encoded in JSON as [null], which json= produces from [None]. A plain null isn't valid for it. Case names never appear in data, and setting a leaf from the dynamic case removes the static case's leaves."},

// ---------- 2.6 Troubleshooting (10) ----------
{g:2,t:"2.6",p:"This request returns 400 Bad Request. What's wrong?",
c:`r = s.get(base + "/ietf-interfaces:interfaces",
          params={"fields": ["interface/name", "interface/enabled"]}, timeout=30)
print(r.url)
# .../ietf-interfaces:interfaces?fields=interface%2Fname&fields=interface%2Fenabled`,
o:["requests repeats a parameter given a list, and RESTCONF rejects duplicates. Use interface(name;enabled).","requests percent-encodes the / in each value, and RESTCONF servers can't decode %2F in a query string","fields can't be used on a container; it only works when the target is a single list entry","fields also needs depth, so the server knows how many levels down the named nodes are found"],
e:"RFC 8040 requires a 400 for a duplicated query parameter. Several nodes go in one fields value, separated by ; with parentheses for a node's children. Encoded characters in the query are decoded normally."},

{g:2,t:"2.6",y:"x",p:"Match each response with its most likely cause.",
s:["401 Unauthorized","405 Method Not Allowed","406 Not Acceptable","415 Unsupported Media Type"],
r:["The body's Content-Type isn't a media type the server accepts","Accept asks for a representation the server can't produce","A GET was sent to an RPC under /restconf/operations","The credentials are missing or wrong"],
o:["1-d, 2-c, 3-b, 4-a","1-d, 2-c, 3-a, 4-b","1-c, 2-d, 3-b, 4-a","1-d, 2-b, 3-c, 4-a"],
e:"Accept describes what the client wants back, so a mismatch is 406. Content-Type describes what it's sending, so a mismatch is 415. Operation resources only allow POST."},

{g:2,t:"2.6",p:"netops logs in over SSH, but every RESTCONF call returns 401. What's the most likely fix?",
c:`aaa new-model
aaa authentication login default local
username netops privilege 1 secret 9 $9$...
restconf
ip http secure-server`,
o:["Give netops privilege 15, and add aaa authorization exec default local","Add ip http server, so that RESTCONF can also listen on port 80 for HTTP","Add netconf-yang, which RESTCONF needs in order to reach the datastore","Add ip http authentication enable, so the enable secret is used"],
e:"RESTCONF on IOS XE needs a privilege 15 user, and with aaa new-model that privilege level is only applied when exec authorization is configured. HTTPS is already enabled, and RESTCONF doesn't depend on NETCONF."},

{g:2,t:"2.6",p:"A script tries to rename Loopback5 to Loopback6 with this request and gets 400. Why, and what works instead?",
c:`PUT /restconf/data/ietf-interfaces:interfaces/interface=Loopback5

{"ietf-interfaces:interface": [{"name": "Loopback6",
  "type": "iana-if-type:softwareLoopback", "description": "MGMT"}]}`,
o:["PUT can't change a key; the body's key must match the URL. Create Loopback6, then delete Loopback5.","The body includes type, which PUT rejects for an entry that already exists, so remove it from the body","PUT needs If-Match to change a key, so GET the entry first and send its ETag with the PUT","Keys can only be changed with PATCH, which merges the new name into the entry"],
e:"Keys identify the resource, so RFC 8040 requires the key values in a PUT body to match the URL. There's no rename: create the new entry, then delete the old one."},

{g:2,t:"2.6",p:"A pipeline creates VLAN 30 with this request. The first run works, but reruns fail as shown. Which change makes reruns succeed, without removing settings other tools add to the VLAN?",
c:`POST /restconf/data/Cisco-IOS-XE-native:native/vlan

{"Cisco-IOS-XE-vlan:vlan-list": [{"id": 30, "name": "VOICE"}]}

409 Conflict
{"ietf-restconf:errors": {"error": [{"error-type": "application",
  "error-tag": "data-exists", "error-message": "object already exists"}]}}`,
o:["PATCH the vlan container with the same body, creating or merging the entry","PUT the same entry to .../native/vlan/Cisco-IOS-XE-vlan:vlan-list=30","Keep the POST, and add ?insert=last so entries that already exist are skipped","DELETE .../vlan-list=30 first, then send the POST again"],
e:"POST only creates, so it fails once the entry exists. PATCH on the parent merges: it creates the entry the first time and only updates name after that. PUT replaces the entry, dropping anything not in the body, and deleting first does the same."},

{g:2,t:"2.6",p:"clear-cache has no output. The RPC runs, but the script crashes on the third line. Why?",
c:`r = s.post("https://10.10.20.48/restconf/operations/example-net:clear-cache", timeout=30)
print(r.status_code)      # 204
result = r.json()         # JSONDecodeError`,
o:["An RPC with no output returns 204 No Content, so there's no body; check the status code instead","Operation replies are always XML, whatever the Accept header asks for, so json() can't parse them","r.json() needs the name of the RPC's output container passed to it as an argument","The reply is chunked, so the script has to read r.raw before it can call r.json()"],
e:"When an operation has no output, the server returns 204 with an empty body, and json() raises JSONDecodeError on an empty string. Only operations with output return 200 and an output container."},

{g:2,t:"2.6",p:"This request returns the error below. What's the fix?",
c:`PATCH /restconf/data/ietf-interfaces:interfaces/interface=Loopback5

{"ietf-interfaces:interface": [{"name": "Loopback5",
  "ipv4": {"address": [{"ip": "10.5.5.5", "prefix-length": 32}]}}]}

400 Bad Request
{"ietf-restconf:errors": {"error": [{"error-type": "application",
  "error-tag": "unknown-element", "error-message": "unknown element: ipv4"}]}}`,
o:[`Name the container "ietf-ip:ipv4"; its children stay unqualified`,`Qualify every member under it too, as "ietf-ip:address", "ietf-ip:ip" and so on`,`Add "type": "iana-if-type:softwareLoopback", which the server checks before ipv4`,"Send the same body to .../interface=Loopback5/ipv4 instead of the interface entry"],
e:"RFC 7951 requires a module-qualified name wherever a node's namespace differs from its parent's, as it does at the ietf-ip augment. Everywhere else, the simple name must be used, so qualifying address and ip would also be wrong."},

{g:2,t:"2.6",p:"A POST creates the resource, but the script never prints created. Why?",
c:`r = s.post(url, json=body, timeout=30)
if r.status_code == 200:
    print("created")`,
o:["A POST that creates a resource returns 201 Created, not 200","requests changes 201 to 200 only when allow_redirects is True","The switch returns 202 Accepted, because RESTCONF edits are queued","status_code is a string, so it never equals the integer 200"],
e:"RESTCONF returns 201 Created, with a Location header, for a new resource. Check for 201, or call raise_for_status() and treat any 2xx as success."},

{g:2,t:"2.6",p:"verify points at the lab CA that signed the switch's certificate. The certificate's subject alternative names are sw1.lab.example and sw1, but calls fail with an SSLError for a hostname mismatch. What's the fix?",
c:`base = "https://10.10.20.48/restconf/data"`,
o:["Use https://sw1.lab.example, or reissue the certificate with the IP address as a SAN","Add the switch's IP address to the CA bundle file that verify points at, then retry","Pass cert=(\"sw1.pem\", \"sw1.key\") so requests can match the certificate's name","Set s.headers[\"Host\"] = \"sw1.lab.example\" so TLS checks that name instead"],
e:"Certificate checking compares the host in the URL with the certificate's SANs. Trust isn't the problem, since the CA validated; the name is. Changing the Host header doesn't change what's checked."},

{g:2,t:"2.6",p:"This request fails with a missing-element error. What must be added to the entry?",
c:TREE_IF+`

PATCH /restconf/data/ietf-interfaces:interfaces
{"ietf-interfaces:interfaces": {"interface": [{"name": "Loopback8",
                                               "description": "TEST"}]}}`,
o:[`"type": "iana-if-type:softwareLoopback", which has no ? in the tree`,`"enabled": true, since a new interface has to be enabled before it can be created`,`"ietf-ip:ipv4": {}, since every interface needs an IPv4 container to be created`,`"oper-status": "up", since the tree shows it without a ? as well`],
e:"In a tree, ? marks an optional leaf. type has none, so a new entry needs it. oper-status has none either, but it's ro: state data can't be written. An identityref value from another module carries that module's name."},

// ---------- 3.6 Troubleshooting REST API workflows (3) ----------
{g:3,t:"3.6",p:"A script POSTs to a controller through a proxy that redirects http:// to https://. It gets 200 and a list of existing items, and nothing is created. Why?",
c:`r = requests.post("http://api.lab.example/api/v1/items", json=item,
                  auth=creds, timeout=30)
print(r.status_code, r.history)   # 200 [<Response [301]>]`,
o:["requests followed the 301 with a GET and no body, so the second call only listed the items","The proxy strips the JSON body from any POST it redirects, but requests still sends it as a POST","A 301 tells requests to retry the POST later, and the 200 is the reply to the original request","The server rejects POST over plain HTTP, so requests switches to GET before sending anything"],
e:"Like browsers, requests turns a POST into a GET when following 301 or 302. Use the https:// URL directly. Only 307 and 308 keep the method and body."},

{g:3,t:"3.6",p:"When the retries run out, the script crashes with RetryError before it reaches raise_for_status(). Which change lets it handle the final 503 response itself?",
c:`retry = Retry(total=3, backoff_factor=1, status_forcelist=[503])
s.mount("https://", HTTPAdapter(max_retries=retry))
r = s.get(url, timeout=30)
r.raise_for_status()`,
o:["Set raise_on_status=False on the Retry, so the last response is returned","Set respect_retry_after_header=False, so the server's Retry-After is ignored","Catch requests.HTTPError instead, because RetryError is a subclass of it","Set total=None on the Retry, so the adapter stops counting the retries"],
e:"With the default raise_on_status=True, running out of status retries raises RetryError, which isn't an HTTPError. With False, the adapter returns the last response, so the script's normal status handling sees the 503."},

{g:3,t:"3.6",p:"A controller API pages its results and puts the next page's URL in a Link header. Which loop collects every item?",
c:`Link: <https://api.lab.example/api/v1/clients?startingAfter=k_1000>; rel="next"`,
o:[`url, items = first, []
while url:
    r = s.get(url, timeout=30)
    items += r.json()
    url = r.links.get("next", {}).get("url")`,
`url, items = first, []
while url:
    r = s.get(url, timeout=30)
    items += r.json()
    url = r.headers.get("Link", {}).get("next")`,
`r = s.get(first, timeout=30, params={"page": "all"})
items = r.json()`,
`url, items = first, []
while r.status_code == 200:
    r = s.get(url, timeout=30)
    items += r.json()`],
e:"requests parses Link headers into r.links, keyed by rel. The loop ends when the last page has no next link. There's no header named next, and paging parameters are specific to each API."},

// ---------- 5.3 AI security (2) ----------
{g:5,t:"5.3",y:"m",p:"An AI assistant generated this function. Which two problems should be fixed before it runs against production? (Choose two.)",
c:`def set_hostname(ip, name):
    r = requests.put(
        f"https://{ip}/restconf/data/Cisco-IOS-XE-native:native/hostname",
        auth=("admin", "C1sco12345"), verify=False, timeout=30,
        json={"Cisco-IOS-XE-native:hostname": name})
    return r.status_code`,
o:["The password is hard-coded; read it from a vault or an environment variable","verify=False lets an attacker in the path capture the credentials","PUT should be POST, because hostname is a leaf that already exists on every switch","The body must wrap hostname in Cisco-IOS-XE-native:native to match the URL","The URL should use http://, so that certificate problems can't stop the change"],
e:"Credentials belong in a secrets store, and certificate checking stops a man-in-the-middle from capturing basic-auth credentials. The PUT and its body are correct for the hostname leaf."},

{g:5,t:"5.3",p:"An AI agent gets a tool that can send any RESTCONF request to production switches, so it can answer questions about interface state. What's the most effective control?",
o:["Give it a tool that only sends GETs to allowlisted paths, and gate change tools behind human approval","Tell the agent in its system prompt never to send PUT, PATCH, POST or DELETE requests to switches","Log every request the agent sends, so that any change it makes can be reviewed and reversed later","Use a model with a larger context window, so that it can reason about the risk of each request first"],
e:"Controls enforced in code hold even if the agent is manipulated, for example by prompt injection in data it reads. A prompt instruction can be overridden, and logging only shows the damage afterwards."},
];
