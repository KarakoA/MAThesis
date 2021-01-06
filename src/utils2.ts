//TODO rename to utils and other to eslint utils
export function nextChar(i: string): string {
  //TODO remove me, backwards compat

  return i ? String.fromCharCode(i.charCodeAt(0) + 1) : "i";
  return String.fromCharCode(i.charCodeAt(0) + 1);
}
