// class Cookies {
//   constructor() {
//     this.isServer = typeof window === "undefined";
//   }

//   get(name) {
//     if (this.isServer) return undefined;
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2)
//       return decodeURIComponent(parts.pop()?.split(";").shift());
//     return undefined;
//   }

//   set(name, value, options = {}) {
//     if (this.isServer) return;
//     let cookie = `${name}=${encodeURIComponent(value)}`;

//     if (options.path) cookie += `; path=${options.path}`;
//     if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
//     if (options.secure) cookie += "; secure";
//     if (options.httpOnly) {
//       console.warn("httpOnly flag is not supported in client-side cookies.");
//     }

//     document.cookie = cookie;
//   }

//   remove(name, path = "/") {
//     if (this.isServer) return;
//     document.cookie = `${name}=; max-age=0; path=${path}`;
//   }
// }
// export const cookies = new Cookies();

class Cookies {
  constructor() {
    this.isServer = typeof window === "undefined";
  }

  get(name) {
    if (this.isServer) return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(";").shift());
    }
    return undefined;
  }

  set(name, value, options = {}) {
    if (this.isServer) return;

    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.path) cookie += `; path=${options.path}`;
    if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
    if (options.expires) cookie += `; expires=${options.expires.toUTCString()}`;
    if (options.secure) cookie += "; secure";
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
    if (options.httpOnly) {
      console.warn("httpOnly flag is not supported in client-side cookies.");
    }

    document.cookie = cookie;
  }

  remove(name, path = "/") {
    if (this.isServer) return;
    document.cookie = `${name}=; max-age=0; path=${path}`;
  }
}

export const cookies = new Cookies();
