goog.provide('rsz.Stage');

/**
 * Stage class handles the website in the iframe
 * @class
 * @export rsz.Stage
 */
class Stage {
  /**
   * constructor
   * @param {Element} element in which to display the website
   */
  constructor(element) {
    /**
     * the container for this component
     */
    this.element = element;


    /**
     * @type {HTMLIFrameElement}
     */
    this.iframe = /** @type {HTMLIFrameElement} */ (element.getElementsByTagName('iframe')[0]);


    /**
     * @type {number}
     */
    this.width = 1;


    /**
     * @type {number}
     */
    this.height= 1;

    /**
     * @type {boolean}
     */
    this.autoSize = true;


    // init
    window.addEventListener('resize', this.redraw.bind(this));
  }


  /**
   * change the rendering size of the website
   * @param {number} w
   * @param {number} h
   * @export
   */
  setSize(w, h) {
    // manual size
    this.autoSize = false;

    // store the new size
    this.width = w;
    this.height = h;
    // refresh display
    this.redraw();
  }


  /**
   * compute content size
   * @return {{w: number, h: number}}
   * @export
   */
  getContentSize() {
    let box = {left: null, right: null, top: null, bottom: null};
    let elements = this.iframe.contentDocument.querySelectorAll('*');
    for (let idx = 0; idx<elements.length; idx++) {
      let element = elements[idx];
      if (box.left === null || element.offsetLeft < box.left) {
        box.left = element.offsetLeft;
      }
      if (box.top === null || element.offsetTop < box.top) {
        box.top = element.offsetTop;
      }
      if (element.offsetLeft + element.offsetWidth > box.right) {
        box.right = element.offsetLeft + element.offsetWidth;
      }
      if (element.offsetTop + element.offsetHeight > box.bottom) {
        box.bottom = element.offsetTop + element.offsetHeight;
      }
    }
    return {
      w: box.right - box.left,
      h: box.bottom - box.top
    };
  }


  /**
   * refresh display
   * apply the real size to the iframe
   * use css transform to fit the container
   * @export
   */
  redraw() {
    // size to content
    if(this.autoSize) {
      let size = this.getContentSize();
      this.width = size.w;
      this.height = size.h;
    }

    // apply the real size
    this.iframe.style.width = this.width + 'px';
    this.iframe.style.height = this.height + 'px';

    // det the scale to fit the container
    let containerSize = {
      w: this.element.offsetWidth,
      h: this.element.offsetHeight
    };
    let scale = {
      x: containerSize.w / this.width,
      y: containerSize.h / this.height
    };
    let finalScale = Math.min(1, scale.x, scale.y);

    // apply the transform
    let str = 'scale(' + finalScale + ')';
    this.iframe.style.transform = str;
    this.iframe.style.transformOrigin = '0 0';

    // center in the container
    let offset = {
      x: (containerSize.w - (this.width * finalScale)) / 2,
      y: (containerSize.h - (this.height * finalScale)) / 2
    };
    this.iframe.style.left = offset.x + 'px';
    this.iframe.style.top = offset.y + 'px';
  }


  /**
   * @param {string} url
   * @return {Promise}
   * @export
   */
  setUrl(url) {
    let promise = new Promise((resolve, reject) => {
      this.iframe.onload = () => resolve(this.iframe.contentDocument);
      this.iframe.onerror = (e) => reject(e);
      this.iframe.src = url;
      this.redraw();
    });
    return promise;
  }


  /**
   * @param {string} html
   * @return {Promise}
   * @export
   */
  setHtml(html) {
    let promise = new Promise((resolve, reject) => {
      this.iframe.onload = () => {
        this.iframe.onload = resolve(this.iframe.contentDocument);
        this.iframe.src = '';
        this.iframe.contentDocument.write(html);
        this.redraw();
      };
      this.iframe.onerror = (e) => reject(e);
      this.iframe.src = 'about:blank';
    });
    return promise;
  }
}
