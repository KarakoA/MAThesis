//TODO rename to utils and other to eslint utils
function nextChar(i) {
  console.log(i);
  return String.fromCharCode(i.charCodeAt() + 1);
}
module.exports = {
  nextChar,
};
