// function mergeUserConfig(target, userPayload) {
//   // Vulnerable: merging untrusted object can poison object prototypes.
//   Object.assign(target, userPayload);
// }

// function setDynamicField(obj, keyFromUser, valueFromUser) {
//   // Vulnerable: user-controlled property key can be "__proto__".
//   obj[keyFromUser] = valueFromUser;
// }

// module.exports = { mergeUserConfig, setDynamicField };
