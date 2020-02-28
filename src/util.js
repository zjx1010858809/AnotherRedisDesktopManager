export default {
  data: {},
  get(name) {
    return this.data[name];
  },
  set(name, value) {
    this.data[name] = value;
  },
  isVisible(string) {
    let ele = document.createElement('p');
    ele.innerHTML = string;

    const equal = (ele.innerHTML === string);
    ele = null;

    return equal;
  },
  bufVisible(buf) {
    const str = buf.toString();
    const bufNew = Buffer.from(str);

    return buf.equals(bufNew);
  },
  bufToHex(buf) {
    const hex = buf.toString('hex');
    let result = '';

    for (var i = 0; i < hex.length; i+=2) {
      result += '\\x' + hex.substr(i, 2);
    }

    return result;
  },
  toUTF8(string) {
    return encodeURI(string).replace(/%/g, '\\x').toLowerCase();
  },
  cutString(string, maxLength = 20) {
    if (string.length <= maxLength) {
      return string;
    }

    return string.substr(0, maxLength) + '...';
  },
  openHrefExternal(e, href) {
    e.preventDefault();
    require('electron').shell.openExternal(href);
  },
};
