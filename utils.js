module.exports = {
  id: function (element) {
    let locId =
      element.loc.start.line +
      "_" +
      element.loc.start.column +
      "_" +
      element.loc.end.line +
      "_" +
      element.loc.end.column;
    return `${element.name}_${locId}`;
  },
};
//TODO filter template util method


