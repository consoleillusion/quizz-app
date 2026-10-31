// NETCONF and ncclient topic set (exam difficulty). ncclient behavior checked against ncclient 0.7.1. Correct option(s) first; mk.js shuffles.
module.exports = [
// ---------- 1.2 NETCONF concepts (12) ----------
{g:1,t:"1.2",y:"x",p:"Match each NETCONF capability with what it allows.",
s:[":candidate",":confirmed-commit",":rollback-on-error",":validate"],
r:["Checking a configuration for errors without applying it","A scratch datastore that's edited and then committed to running","An edit that's undone entirely if any part fails","A commit that reverts unless it's confirmed within a timeout"],
o:["1-b, 2-d, 3-c, 4-a","1-d, 2-b, 3-c, 4-a","1-b, 2-c, 3-d, 4-a","1-b, 2-d, 3-a, 4-c"],
e:"Capabilities advertise optional features in the hello. Clients should check them before using commit, confirmed commit, rollback-on-error or validate."},

{g:1,t:"1.2",p:"Both peers advertise urn:ietf:params:netconf:base:1.1. How are messages delimited for the rest of the session?",
o:["Chunked framing, with each chunk preceded by #<length> and the message ended by ##","The ]]>]]> end-of-message marker after each message, as in every NETCONF session regardless of version","An HTTP Content-Length header on each message","A newline after each XML document"],
e:"base:1.0 uses ]]>]]>, which breaks if that string appears in data. base:1.1 switches to chunked framing once both sides support it. The hellos themselves always use ]]>]]>."},

{g:1,t:"1.2",y:"m",p:"Which two items does the server's <hello> contain? (Choose two.)",
o:["The capabilities it supports, including the YANG modules it implements","The session-id assigned to this session","The message-id of the client's first RPC","The current running configuration","The privilege level of the user who logged in"],
e:"The server's hello lists capabilities and assigns a session-id. The client's hello lists only capabilities. RPCs, with their message-ids, come after the hello exchange."},

{g:1,t:"1.2",p:"Which datastore does every NETCONF server have, whatever capabilities it advertises?",
o:["running","candidate","startup","intended"],
e:"running is mandatory. candidate needs :candidate, startup needs :startup (IOS XE doesn't offer it), and intended belongs to NMDA."},

{g:1,t:"1.2",p:"A client sends several RPCs on one session. How does it match each <rpc-reply> to its request?",
o:["The reply repeats the message-id attribute of the <rpc> it answers","Replies always arrive in reverse order","The reply carries the session-id of the request, which is unique for each RPC on the session","Each reply includes a copy of the request"],
e:"message-id is set by the client on each <rpc>, and the server echoes it on the reply. The session-id identifies the session, not the RPC."},

{g:1,t:"1.2",p:"A crashed script left a lock on the candidate datastore, held by session 41. What frees it from another session?",
o:["<kill-session> with session-id 41, which ends that session and releases its locks","<close-session> from the new session, which closes every other session and releases all of their locks","<unlock> from the new session, which can release any session's lock","Nothing; the lock stays until the device reloads"],
e:"Only the lock holder can unlock. kill-session forcibly ends another session, which releases its locks and aborts its operations. close-session only closes the caller's own session."},

{g:1,t:"1.2",y:"m",p:"Which two can NETCONF do on IOS XE that RESTCONF can't? (Choose two.)",
o:["Lock a datastore so a multi-step change isn't interrupted by other sessions","Stage changes in the candidate datastore, validate them and commit them together","Encode payloads in JSON as well as XML, chosen per request with the Accept header","Map operations to HTTP methods such as PATCH","Read operational state data"],
e:"RESTCONF is stateless, so each request is its own change to running, with no locks or candidate. Both can read state, and JSON and HTTP methods belong to RESTCONF."},

{g:1,t:"1.2",p:"In NMDA (RFC 8342), which datastore holds all configuration and state currently in use, and how is it read?",
o:["The operational datastore, read with <get-data> (RFC 8526)","The running datastore, read with <get-config>","The candidate datastore, read with <get>","The intended datastore, read with <get-config>, which includes state alongside configuration"],
e:"<operational> combines the configuration in effect with state. get-data can target any NMDA datastore. get-config never returns state."},

{g:1,t:"1.2",y:"o",p:"Put the steps of a NETCONF session in order.",
s:["The client and server exchange <hello> messages","The client sends <close-session>","The client opens SSH to port 830 and requests the netconf subsystem","The client sends <rpc> requests and receives <rpc-reply> messages"],
o:["3, 1, 4, 2","1, 3, 4, 2","3, 4, 1, 2","3, 1, 2, 4"],
e:"The secure transport comes first, then the capability exchange, then any number of RPCs, and finally a clean close."},

{g:1,t:"1.2",p:"What does the :writable-running capability mean?",
o:["edit-config can target running directly, without going through candidate","running can be copied to startup","running can be deleted with delete-config, and then rebuilt from a template with copy-config","running can be locked"],
e:"Devices without :writable-running only accept changes through candidate and commit. IOS XE advertises :writable-running, which is why scripts can edit running directly."},

{g:1,t:"1.2",p:"Which command opens a raw NETCONF session for testing by hand?",
o:["ssh -p 830 admin@10.0.0.11 -s netconf","ssh -p 22 admin@10.0.0.11 netconf-yang","telnet 10.0.0.11 830","curl -k https://10.0.0.11:830/netconf"],
e:"NETCONF over SSH uses the netconf subsystem, which -s requests, by default on port 830. The server then sends its hello, and the client must reply with its own."},

{g:1,t:"1.2",p:"Which of these isn't a base NETCONF operation defined in RFC 6241?",
o:["establish-subscription","get-config","kill-session","copy-config"],
e:"establish-subscription comes from the subscribed-notifications and yang-push work. The base operations are get, get-config, edit-config, copy-config, delete-config, lock, unlock, close-session and kill-session, with commit and others added by capabilities."},

{g:1,t:"1.2",p:"A device offers NETCONF over TLS (RFC 7589) instead of SSH. Which port does it use by default?",
o:["6513","830","443","22"],
e:"NETCONF over TLS uses 6513, and NETCONF over SSH uses 830. RESTCONF runs over HTTPS on 443."},

// ---------- 2.2 ncclient (26) ----------
{g:2,t:"2.2",y:"g",p:"Fill the gaps to open a NETCONF session to a Catalyst 9300 running IOS XE, in a lab where its host key isn't known yet.",
c:`from ncclient import manager

m = manager.connect(host="10.0.0.11", port=⟦1⟧,
                    username=user, password=pw,
                    hostkey_verify=⟦2⟧,
                    device_params={"name": "⟦3⟧"})`,
bank:["830","22","443","False","True","iosxe","junos","default"],
a:["830","False","iosxe"],
e:"NETCONF listens on 830. hostkey_verify=False skips the known_hosts check, acceptable only in a lab. The iosxe device handler adds IOS XE-specific behavior."},

{g:2,t:"2.2",p:"This call fails on a switch that doesn't offer the candidate datastore. Why?",
c:`with manager.connect(**params) as m:
    m.edit_config(config=CFG)`,
o:["ncclient's edit_config targets candidate unless target is given, so the request asks for a datastore the switch doesn't have","edit_config needs default_operation to be set","CFG must not start with <config>","edit_config can only be used inside m.locked(), because ncclient refuses unlocked edits to any datastore on IOS XE"],
e:"edit_config's target parameter defaults to candidate. Pass target=\"running\" on devices that only offer :writable-running."},

{g:2,t:"2.2",p:"A script must read interface counters. Which call returns them?",
o:["m.get(filter=(\"subtree\", FLT))","m.get_config(source=\"running\", filter=(\"subtree\", FLT))","m.get_config(source=\"candidate\", filter=(\"subtree\", FLT))","m.get_schema(\"ietf-interfaces\")"],
e:"get returns configuration and state, while get_config returns configuration only. get_schema returns a module's YANG text, not data."},

{g:2,t:"2.2",p:"Which filter argument sends a working XPath filter for interface Gi1 in ietf-interfaces?",
o:["filter=(\"xpath\", ({\"if\": \"urn:ietf:params:xml:ns:yang:ietf-interfaces\"}, \"/if:interfaces/if:interface[if:name='Gi1']\"))","filter=(\"xpath\", (\"/if:interfaces/if:interface[if:name='Gi1']\", {\"if\": \"urn:ietf:params:xml:ns:yang:ietf-interfaces\"}))","filter=(\"subtree\", \"/if:interfaces/if:interface[if:name='Gi1']\")","filter=(\"xpath\", \"/if:interfaces/if:interface[if:name='Gi1']\", {\"if\": \"urn:ietf:params:xml:ns:yang:ietf-interfaces\"})"],
e:"For XPath, ncclient takes (\"xpath\", (namespaces, select)), with the prefix map first, so the prefixes can be declared on the filter. Subtree filters take XML, not a path."},

{g:2,t:"2.2",p:"Why does this get fail?",
c:`FLT = """
<filter type="subtree">
  <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
    <interface><name>Gi1</name></interface>
  </interfaces>
</filter>"""
reply = m.get(filter=("subtree", FLT))`,
o:["ncclient adds the <filter> element itself, so the request ends up with a filter nested inside a filter","Subtree filters can't select by name","The filter needs type=\"xpath\"","The namespace must be declared on <interface>, not on <interfaces>, because filters match from the list level"],
e:"With the (\"subtree\", criteria) form, criteria is the content only. ncclient wraps it in <filter type=\"subtree\">."},

{g:2,t:"2.2",p:"Which attribute of a get reply gives the <data> element as an lxml element ready for find() and xpath()?",
o:["reply.data_ele","reply.data_xml","reply.xml","reply.ok"],
e:"data_ele is the parsed <data> element, data_xml is the same as a string, xml is the whole rpc-reply as a string, and ok is a boolean."},

{g:2,t:"2.2",y:"g",p:"Fill the gap so findall returns every interface element in the reply.",
c:`root = m.get(filter=("subtree", FLT)).data_ele
for intf in root.findall(".//{⟦1⟧}interface"):
    print(intf.findtext("{urn:ietf:params:xml:ns:yang:ietf-interfaces}name"))`,
bank:["urn:ietf:params:xml:ns:yang:ietf-interfaces","ietf-interfaces","if","urn:ietf:params:xml:ns:netconf:base:1.0"],
a:["urn:ietf:params:xml:ns:yang:ietf-interfaces"],
e:"lxml matches qualified names, written in Clark notation as {namespace-uri}local-name, or with a prefix map passed to findall. Module names and prefixes aren't namespaces."},

{g:2,t:"2.2",p:"What does m.locked() add to this code?",
c:`with manager.connect(**params) as m:
    with m.locked("candidate"):
        m.edit_config(target="candidate", config=CFG)
        m.validate(source="candidate")
        m.commit()`,
o:["It locks candidate on entry and unlocks it on exit, even if a step raises an exception","It runs the three calls as one atomic RPC","It opens a second session that holds the lock while this session makes the changes and commits them","It commits automatically when the block exits"],
e:"locked() is a context manager around lock and unlock, so a failure can't leave the datastore locked. The calls inside are still separate RPCs."},

{g:2,t:"2.2",y:"g",p:"Fill the gaps so the change reverts after 5 minutes unless confirmed, and can be confirmed later from a new session using the token chg-42.",
c:`# Session 1
m.edit_config(target="candidate", config=CFG)
m.commit(⟦1⟧=True, ⟦2⟧="300", ⟦3⟧="chg-42")

# Session 2, after checks pass
m2.commit(⟦4⟧="chg-42")`,
bank:["confirmed","timeout","persist","persist_id","confirm","delay","token"],
a:["confirmed","timeout","persist","persist_id"],
e:"persist lets the confirmed commit outlive its session and sets a token. A later commit, or cancel_commit, from any session uses persist_id with that token."},

{g:2,t:"2.2",p:"A confirmed commit with persist=\"chg-42\" is pending, and post-change checks fail. What's the cleanest way to roll back now, instead of waiting for the timeout?",
o:["m.cancel_commit(persist_id=\"chg-42\")","m.discard_changes()","m.commit(confirmed=False)","m.unlock(\"candidate\")"],
e:"cancel-commit reverts a pending confirmed commit immediately. discard_changes only resets uncommitted candidate edits, and a plain commit would confirm the change."},

{g:2,t:"2.2",p:"validate() reports errors in the edited candidate. Which call throws the uncommitted edits away?",
o:["m.discard_changes()","m.cancel_commit()","m.delete_config(target=\"candidate\")","m.unlock(\"candidate\")"],
e:"discard-changes resets candidate to match running. cancel-commit is for pending confirmed commits, and unlocking doesn't undo edits."},

{g:2,t:"2.2",p:"What does m.validate(source=\"candidate\") do?",
o:["Checks the candidate configuration against the models and constraints without applying it","Commits candidate if it's valid","Compares candidate with running and returns the differences as a list of changed nodes for review","Checks that the session still holds the lock on candidate"],
e:"Validation catches errors such as must or leafref failures before commit. It needs the :validate capability."},

{g:2,t:"2.2",y:"g",p:"Fill the gaps so the script saves the running configuration to startup on IOS XE.",
c:`from ncclient.xml_ import to_ele

m.⟦1⟧(to_ele('<⟦2⟧ xmlns="⟦3⟧"/>'))`,
bank:["dispatch","get","edit_config","save-config","write-memory","copy-config","http://cisco.com/yang/cisco-ia","http://cisco.com/ns/yang/Cisco-IOS-XE-native"],
a:["dispatch","save-config","http://cisco.com/yang/cisco-ia"],
e:"dispatch sends any RPC element. IOS XE has no startup datastore over NETCONF, so the cisco-ia save-config RPC does the save."},

{g:2,t:"2.2",p:"What happens when a script calls m.delete_config(target=\"running\")?",
o:["It fails, because the running datastore can't be deleted","It erases the running configuration","It reloads the device with a factory configuration","It deletes the candidate instead"],
e:"RFC 6241 forbids deleting running. delete-config is for other datastores, such as startup on devices that have it."},

{g:2,t:"2.2",p:"How can a script find which revision of Cisco-IOS-XE-native the device implements?",
o:["Find the capability URI for Cisco-IOS-XE-native in m.server_capabilities and read its revision parameter","Call m.get_config and read the revision attribute that the device adds to every reply's root data element","Read m.session_id, which encodes the model revision","Call m.dispatch(\"revision\")"],
e:"Module capabilities look like http://cisco.com/ns/yang/Cisco-IOS-XE-native?module=Cisco-IOS-XE-native&revision=…, and the revision tells you which version of the model to code against."},

{g:2,t:"2.2",p:"get_config doesn't return interface MTUs that are still at their default. Which change includes them?",
o:["Pass with_defaults=\"report-all\"","Pass source=\"startup\"","Use get_schema instead","Add <mtu/> to a subtree filter, which forces defaults to be shown"],
e:"Servers usually leave out default values. with-defaults (RFC 6243) report-all includes them, if the device supports it."},

{g:2,t:"2.2",p:"A script should collect every error from a batch of edits and report them at the end, without stopping at the first one. What does it set?",
o:["m.raise_mode = RaiseMode.NONE, then check reply.ok and reply.errors after each call","m.raise_mode = RaiseMode.ALL, which collects errors silently and raises them all at the end","m.timeout = 0, which disables exceptions","hostkey_verify=False, which turns off error raising"],
e:"ncclient's default, RaiseMode.ALL, raises RPCError on any rpc-error. NONE never raises, so the script inspects each reply itself."},

{g:2,t:"2.2",y:"g",p:"Fill the gaps so the handler prints the error-tag and error-path.",
c:`from ncclient.operations.rpc import RPCError

try:
    m.edit_config(target="running", config=CFG)
except RPCError as e:
    print(e.⟦1⟧, e.⟦2⟧)`,
bank:["tag","path","message","severity","error_tag","xpath"],
a:["tag","path"],
e:"RPCError exposes the rpc-error fields as tag, path, message, severity, type, app_tag and info."},

{g:2,t:"2.2",p:"A get of a large operational subtree fails with TimeoutExpiredError after 30 seconds. What's the fix?",
o:["Raise the manager's RPC timeout, for example m.timeout = 120, or narrow the filter","Pass timeout=120 to manager.connect, which sets the RPC reply timeout but not the SSH connection","Set hostkey_verify=False, which speeds up the session","Switch to get_config, which never times out"],
e:"The manager waits 30 seconds for each reply by default. connect's timeout covers the SSH connection itself. A tighter filter also reduces the reply."},

{g:2,t:"2.2",p:"Parsing a very large reply fails with an lxml error about a huge text node. What does the script set?",
o:["m.huge_tree = True","m.raise_mode = RaiseMode.NONE","m.timeout = 600","device_params={\"name\": \"huge\"}"],
e:"lxml limits node sizes by default for safety. huge_tree lifts the limit for trusted devices returning very large data."},

{g:2,t:"2.2",p:"Which call ends session 41, which holds a stale lock?",
o:["m.kill_session(\"41\")","m.close_session(\"41\")","m.unlock(\"candidate\", session_id=\"41\")","m.discard_changes(\"41\")"],
e:"kill_session terminates another session by ID and releases its locks. close_session closes the caller's own session."},

{g:2,t:"2.2",p:"An edit uses default_operation=\"none\", and one element carries nc:operation=\"delete\". What changes?",
c:`<config xmlns:nc="urn:ietf:params:xml:ns:netconf:base:1.0">
  <native xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
    <hostname>SW1</hostname>
    <banner><motd nc:operation="delete"/></banner>
  </native>
</config>`,
o:["Only the MOTD banner is deleted; hostname, with no operation of its own, is left unchanged","The hostname is set to SW1 and the banner is deleted, because each element is applied as it's found","Nothing, because none disables every operation","The whole native tree is replaced"],
e:"With default-operation none, elements without an operation are only used to locate the explicit ones. merge would also have set the hostname."},

{g:2,t:"2.2",p:"What does test_option=\"test-only\" do in edit_config?",
o:["Validates the edit without applying it, where the device supports :validate:1.1","Applies the edit, then rolls it back after 10 minutes unless a confirming commit is sent","Applies the edit only to candidate","Applies the edit, skipping validation"],
e:"test-only checks an edit as if it were applied, which suits pre-change checks. test-then-set (the default) checks and applies."},

{g:2,t:"2.2",y:"m",p:"Which two connect arguments stop ncclient from trying local SSH keys and an SSH agent, so only the password is used? (Choose two.)",
o:["look_for_keys=False","allow_agent=False","hostkey_verify=False","device_params={\"name\": \"default\"}","timeout=10"],
e:"By default, paramiko tries keys in ~/.ssh and any agent before the password, which can trigger lockouts on devices that count failed attempts. hostkey_verify concerns the server's key, not the client's."},

{g:2,t:"2.2",p:"What happens when the with block ends?",
c:`with manager.connect(**params) as m:
    print(m.session_id)`,
o:["ncclient sends close-session and closes the SSH connection","Nothing; the session stays open until the script exits","The session is killed with kill-session","Any locks are kept for the next connection"],
e:"The manager is a context manager, which ends the session cleanly. Locks belong to the session, so they're released with it."},

// ---------- 1.4 XML for NETCONF (4) ----------
{g:1,t:"1.4",p:"Which interfaces does this subtree filter return?",
c:`<interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
  <interface>
    <type xmlns:ianaift="urn:ietf:params:xml:ns:yang:iana-if-type">ianaift:ethernetCsmacd</type>
    <enabled>true</enabled>
    <name/>
  </interface>
</interfaces>`,
o:["The names of interfaces that are both Ethernet and enabled","The names of interfaces that are Ethernet or enabled","Every interface, because <name/> is empty","Only the type and enabled leaves of every interface"],
e:"Sibling content-match nodes must all match, so they combine with AND. The empty <name/> is a selection node naming what to return."},

{g:2,t:"2.2",p:"edit_config raises an error that the element doesn't meet the requirement. CFG starts with <native xmlns=\"http://cisco.com/ns/yang/Cisco-IOS-XE-native\">. What's the fix?",
o:["Wrap the payload in a <config> element","Use format=\"json\"","Add nc:operation=\"merge\" to <native>","Send it with get_config instead"],
e:"ncclient requires the XML config to be rooted in <config>. The model's content goes inside it."},

{g:1,t:"1.4",p:"Port Gi1 has a description, a role and a VLAN. What's left after this edit?",
c:`<config xmlns:nc="urn:ietf:params:xml:ns:netconf:base:1.0">
  <switch xmlns="urn:example:sw">
    <port nc:operation="replace">
      <name>Gi1</name>
      <vlan>20</vlan>
    </port>
  </switch>
</config>`,
o:["Only name and VLAN 20; the description and role are removed","Name, description, role and VLAN 20","Every other port is removed, and Gi1 keeps only name and VLAN","Nothing changes, because replace needs default_operation=\"replace\""],
e:"replace on an element replaces just that element's subtree. Other ports are untouched, because the operation applies only where it's set."},

{g:1,t:"1.4",p:"An edit has no operation attributes and default_operation isn't set. What happens to existing configuration not mentioned in the payload?",
o:["It's kept, because the default operation is merge","It's deleted, because the payload replaces the datastore","The edit is rejected until an operation is given","It's moved to candidate"],
e:"merge is the default, so the payload's content is added or updated and everything else stays."},

// ---------- 2.6 Troubleshooting (10) ----------
{g:2,t:"2.6",y:"x",p:"Match each NETCONF error-tag with its most likely cause.",
s:["lock-denied","access-denied","operation-not-supported","data-missing"],
r:["The device doesn't support the requested operation, such as commit without :candidate","Another session already holds the lock","A delete targeted data that doesn't exist","NACM doesn't allow this user to perform the operation"],
o:["1-b, 2-d, 3-a, 4-c","1-d, 2-b, 3-a, 4-c","1-b, 2-a, 3-d, 4-c","1-b, 2-d, 3-c, 4-a"],
e:"The error-tag says which kind of problem occurred. error-path and error-info then point at the exact node or session involved."},

{g:2,t:"2.6",p:"manager.connect raises AuthenticationError. What does that point to?",
o:["The username or password was rejected by the device","The device's host key isn't in known_hosts","The NETCONF agent isn't running on port 830, so the login can't complete","The user lacks NACM write permissions"],
e:"Authentication happens in SSH, before NETCONF starts. Host key problems raise SSHUnknownHostError, a closed port fails to connect, and NACM problems show up later as access-denied."},

{g:2,t:"2.6",p:"manager.connect raises SSHUnknownHostError against a newly installed switch. What's the right fix?",
o:["Add the switch's host key to known_hosts, or set hostkey_verify=False only in a lab","Set look_for_keys=False","Use port 22 instead of 830, because the host key presented on port 830 is only a temporary one","Set device_params to iosxe"],
e:"ncclient checks the server's host key by default. Disabling the check removes protection against impersonation, so production code should trust the real key."},

{g:2,t:"2.6",p:"m.commit() returns an rpc-error with error-tag operation-not-supported on an IOS XE switch. What's the likely cause and fix?",
o:["The candidate datastore isn't enabled; configure netconf-yang feature candidate-datastore, or edit running directly","The commit needs a timeout argument","Another session holds the lock on running, so the commit can't write the new configuration into it until it's released","The user isn't privilege 15"],
e:"commit belongs to :candidate. IOS XE only offers candidate when it's enabled, and then edits to running are no longer allowed."},

{g:2,t:"2.6",p:"m.commit(confirmed=True, timeout=\"120\") raises MissingCapabilityError before anything is sent. Why?",
o:["ncclient checks that the device advertises :confirmed-commit, and it doesn't","The timeout must be an integer","Confirmed commits need a lock","The session must be closed first, because confirmed commits have to start in a new session"],
e:"ncclient asserts the capability on the client side for confirmed commits, so the request never reaches the device. Check m.server_capabilities first."},

{g:2,t:"2.6",p:"An edit returns error-tag malformed-message. What's the most likely cause?",
o:["The XML isn't well-formed, for example an unclosed tag or a bad character","A value is outside the model's range","The element doesn't exist in the model, so the server can't work out where to place it","The datastore is locked"],
e:"malformed-message means the server couldn't parse the message at all. Model problems give invalid-value or unknown-element instead."},

{g:2,t:"2.6",p:"An rpc-error has error-tag invalid-value. Which field shows exactly which node was rejected?",
o:["error-path","error-severity","error-type","message-id"],
e:"error-path is an XPath to the failing node. error-type says which layer failed, and severity whether it's an error or a warning."},

{g:2,t:"2.6",p:"The device returns an rpc-error with severity warning, but applies the change. ncclient raises RPCError and the script stops. Which setting keeps it running on warnings but still raises on errors?",
o:["m.raise_mode = RaiseMode.ERRORS","m.raise_mode = RaiseMode.ALL","m.raise_mode = RaiseMode.NONE","m.huge_tree = True"],
e:"ALL, the default, raises on any rpc-error, including warnings. ERRORS raises only on errors, and NONE never raises."},

{g:2,t:"2.6",p:"netconf-yang was enabled a minute ago, and connections to port 830 are refused. What's the most likely explanation?",
o:["The NETCONF agent is still starting, which takes a few minutes; check show platform software yang-management process","The port must be changed to 22","NETCONF needs a reload after it's enabled, because the SSH server only reads its list of subsystems at boot","RESTCONF must be enabled first"],
e:"The YANG management processes start in the background after netconf-yang is configured. When they're all running, port 830 answers."},

{g:2,t:"2.6",p:"An edit returns unknown-element with error-info naming bad-element hostnme. What's wrong?",
o:["The element name is misspelled; the model calls it hostname","The namespace is wrong","The value is too long","The user isn't allowed to change the hostname under NACM rules"],
e:"error-info gives detail such as bad-element, bad-attribute, bad-namespace or session-id, depending on the error."},

// ---------- 4.5 Dynamic subscriptions over NETCONF (5) ----------
{g:4,t:"4.5",y:"g",p:"Fill the gaps so this dynamic subscription sends CPU data every 10 seconds.",
c:`RPC = """
<establish-subscription xmlns="⟦1⟧"
    xmlns:yp="urn:ietf:params:xml:ns:yang:ietf-yang-push">
  <stream>yp:yang-push</stream>
  <yp:xpath-filter>/process-cpu-ios-xe-oper:cpu-usage/cpu-utilization</yp:xpath-filter>
  <yp:⟦2⟧>⟦3⟧</yp:⟦4⟧>
</establish-subscription>"""
reply = m.dispatch(to_ele(RPC))`,
bank:["urn:ietf:params:xml:ns:yang:ietf-event-notifications","urn:ietf:params:xml:ns:netconf:base:1.0","period","dampening-period","1000","10","10000"],
a:["urn:ietf:params:xml:ns:yang:ietf-event-notifications","period","1000","period"],
e:"IOS XE uses the ietf-event-notifications namespace for establish-subscription. period is in centiseconds, so 1000 is 10 seconds, and dampening-period is for on-change."},

{g:4,t:"4.5",p:"After the subscription is established, which call receives each update?",
o:["m.take_notification(), then read notification_xml or notification_ele","m.get() in a loop, every period","m.dispatch(\"receive\")","m.create_subscription(), which returns all of the updates together as a list"],
e:"Updates arrive as notifications on the same session. take_notification waits for the next one, optionally with a timeout."},

{g:4,t:"4.5",y:"m",p:"Which two end a dynamic subscription? (Choose two.)",
o:["Closing the NETCONF session that created it","Sending delete-subscription with its subscription-id","Removing telemetry ietf subscription from the running configuration","Restarting the collector","Saving the configuration to startup"],
e:"Dynamic subscriptions belong to their session and aren't in the configuration. They end when the session closes or when they're deleted by ID."},

{g:4,t:"4.5",p:"The establish-subscription reply contains a subscription-result of ok and a subscription-id. What should the script keep?",
o:["The subscription-id, to delete or modify the subscription later","Nothing, because dynamic subscriptions can't be changed","The message-id of the reply, which identifies the stream","The session-id, which replaces the subscription-id"],
e:"The ID identifies the subscription in later RPCs and in the notifications themselves."},

{g:4,t:"4.5",p:"A subscription is created by edit_config with the Cisco-IOS-XE-mdt-cfg model. How does it differ from one made with establish-subscription?",
o:["It's a configured subscription: it persists in running config and dials out to a receiver","It ends when the NETCONF session closes","It streams back over the NETCONF session that created it, and ends when that session closes","It can only be removed by reloading"],
e:"Writing configuration creates a configured subscription, the same as the CLI. establish-subscription creates a dynamic one tied to the session."},

// ---------- 2.4 Ansible and NETCONF crossover (3) ----------
{g:2,t:"2.4",y:"g",p:"Fill the gaps so the task stages the change in candidate, always locks it, and commits.",
c:`- name: Push NTP configuration over NETCONF
  ansible.netcommon.netconf_config:
    content: "{{ lookup('file', 'ntp.xml') }}"
    target: ⟦1⟧
    lock: ⟦2⟧
    commit: ⟦3⟧`,
bank:["candidate","running","startup","always","never","if-supported","true","false"],
a:["candidate","always","true"],
e:"netconf_config's target is auto (candidate if supported), candidate or running. lock can be always, never or if-supported, and commit controls whether candidate is committed."},

{g:2,t:"2.4",p:"Which Ansible module reads operational state from a device with a subtree filter over NETCONF?",
o:["ansible.netcommon.netconf_get","ansible.netcommon.netconf_config","cisco.ios.ios_facts with gather_subset: netconf","ansible.builtin.uri"],
e:"netconf_get runs get, or get-config when source is set, with a filter, and can return the result as XML or JSON."},

{g:2,t:"2.4",p:"A playbook must call the cisco-ia save-config RPC over NETCONF. Which module fits?",
o:["ansible.netcommon.netconf_rpc","ansible.netcommon.netconf_config with save: true on any device","cisco.ios.ios_command with write memory over NETCONF","ansible.netcommon.netconf_get with the RPC as its filter"],
e:"netconf_rpc sends any RPC, with its namespace and content. netconf_get only reads, and ios_command uses the CLI."}
];
