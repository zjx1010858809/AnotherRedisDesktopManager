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
    let result = buf.toJSON().data.map(item => {
      if (item >= 32 && item <= 126) {
        return String.fromCharCode(item);
      }
      return "\\x" + item.toString(16);
    });

    return result.join('');
  },
  bufToString(buf) {
    console.log(buf.toString(), '====');
    if (this.bufVisible(buf)) {
      return buf.toString();
    }

    return this.bufToHex(buf);
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
