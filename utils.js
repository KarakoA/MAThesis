module.exports = {
  id: function (element) {
    let locId =
      element.loc.start.line +
      ":" +
      element.loc.start.column +
      "-" +
      element.loc.end.line +
      ":" +
      element.loc.end.column;
    return `${element.name}[${locId}]`;
  },
};
//TODO filter template util method