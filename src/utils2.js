//TODO rename to utils and other to eslint utils
function nextChar(i) {
  return i ? String.fromCharCode(i.charCodeAt() + 1) : "i";
}
module.exports = {
  nextChar,
};
