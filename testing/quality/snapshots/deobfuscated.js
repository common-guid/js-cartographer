/*! For license information please see bundle.js.LICENSE.txt */
(function () {
  "use strict";

  function t(t, n) {
    return t + n;
  }
  function n(t, n) {
    return t * n;
  }
  function r(t) {
    return n(Math.PI, n(t, t));
  }
  function e(t, n, r) {
    if (t < n) {
      return n;
    } else if (t > r) {
      return r;
    } else {
      return t;
    }
  }
  function o(t) {
    o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function (t) {
      return typeof t;
    } : function (t) {
      if (t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype) {
        return "symbol";
      } else {
        return typeof t;
      }
    };
    return o(t);
  }
  function i(t, n) {
    for (var r = 0; r < n.length; r++) {
      var e = n[r];
      e.enumerable = e.enumerable || false;
      e.configurable = true;
      if ("value" in e) {
        e.writable = true;
      }
      Object.defineProperty(t, c(e.key), e);
    }
  }
  function c(t) {
    var n = function (t) {
      if (o(t) != "object" || !t) {
        return t;
      }
      var n = t[Symbol.toPrimitive];
      if (n !== undefined) {
        var r = n.call(t, "string");
        if (o(r) != "object") {
          return r;
        }
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(t);
    }(t);
    if (o(n) == "symbol") {
      return n;
    } else {
      return n + "";
    }
  }
  function u(n, r) {
    var e = function (t) {
      if (t < 12) {
        return "morning";
      } else if (t < 18) {
        return "afternoon";
      } else {
        return "evening";
      }
    }(r);
    var o = t(2, n.split(" ").length);
    return `Good ${e}, ${n}! Your greeting has ${o} words.`;
  }
  var a = function () {
    n = function t(n) {
      (function (t, n) {
        if (!(t instanceof n)) {
          throw new TypeError("Cannot call a class as a function");
        }
      })(this, t);
      this.locale = n;
      this.greetingCount = 0;
    };
    if (r = [{
      key: "formatFormal",
      value: function (n) {
        this.greetingCount = t(this.greetingCount, 1);
        return `Dear ${n}, greetings from locale ${this.locale}.`;
      }
    }, {
      key: "getStats",
      value: function () {
        return {
          locale: this.locale,
          totalGreetings: this.greetingCount
        };
      }
    }]) {
      i(n.prototype, r);
    }
    Object.defineProperty(n, "prototype", {
      writable: false
    });
    return n;
    var n;
    var r;
  }();
  function f(t) {
    f = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function (t) {
      return typeof t;
    } : function (t) {
      if (t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype) {
        return "symbol";
      } else {
        return typeof t;
      }
    };
    return f(t);
  }
  function l() {
    var t;
    var n;
    var r = typeof Symbol == "function" ? Symbol : {};
    var e = r.iterator || "@@iterator";
    var o = r.toStringTag || "@@toStringTag";
    function i(r, e, o, i) {
      var a = e && e.prototype instanceof u ? e : u;
      var f = Object.create(a.prototype);
      s(f, "_invoke", function (r, e, o) {
        var i;
        var u;
        var a;
        var f = 0;
        var l = o || [];
        var s = false;
        var p = {
          p: 0,
          n: 0,
          v: t,
          a: y,
          f: y.bind(t, 4),
          d: function (n, r) {
            i = n;
            u = 0;
            a = t;
            p.n = r;
            return c;
          }
        };
        function y(r, e) {
          u = r;
          a = e;
          n = 0;
          for (; !s && f && !o && n < l.length; n++) {
            var o;
            var i = l[n];
            var y = p.p;
            var v = i[2];
            if (r > 3) {
              if (o = v === e) {
                a = i[(u = i[4]) ? 5 : (u = 3, 3)];
                i[4] = i[5] = t;
              }
            } else if (i[0] <= y) {
              if (o = r < 2 && y < i[1]) {
                u = 0;
                p.v = e;
                p.n = i[1];
              } else if (y < v && (o = r < 3 || i[0] > e || e > v)) {
                i[4] = r;
                i[5] = e;
                p.n = v;
                u = 0;
              }
            }
          }
          if (o || r > 1) {
            return c;
          }
          s = true;
          throw e;
        }
        return function (o, l, v) {
          if (f > 1) {
            throw TypeError("Generator is already running");
          }
          if (s && l === 1) {
            y(l, v);
          }
          u = l;
          a = v;
          while ((n = u < 2 ? t : a) || !s) {
            if (!i) {
              if (u) {
                if (u < 3) {
                  if (u > 1) {
                    p.n = -1;
                  }
                  y(u, a);
                } else {
                  p.n = a;
                }
              } else {
                p.v = a;
              }
            }
            try {
              f = 2;
              if (i) {
                if (!u) {
                  o = "next";
                }
                if (n = i[o]) {
                  if (!(n = n.call(i, a))) {
                    throw TypeError("iterator result is not an object");
                  }
                  if (!n.done) {
                    return n;
                  }
                  a = n.value;
                  if (u < 2) {
                    u = 0;
                  }
                } else {
                  if (u === 1 && (n = i.return)) {
                    n.call(i);
                  }
                  if (u < 2) {
                    a = TypeError("The iterator does not provide a '" + o + "' method");
                    u = 1;
                  }
                }
                i = t;
              } else if ((n = (s = p.n < 0) ? a : r.call(e, p)) !== c) {
                break;
              }
            } catch (n) {
              i = t;
              u = 1;
              a = n;
            } finally {
              f = 1;
            }
          }
          return {
            value: n,
            done: s
          };
        };
      }(r, o, i), true);
      return f;
    }
    var c = {};
    function u() {}
    function a() {}
    function f() {}
    n = Object.getPrototypeOf;
    var p = [][e] ? n(n([][e]())) : (s(n = {}, e, function () {
      return this;
    }), n);
    var y = f.prototype = u.prototype = Object.create(p);
    function v(t) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(t, f);
      } else {
        t.__proto__ = f;
        s(t, o, "GeneratorFunction");
      }
      t.prototype = Object.create(y);
      return t;
    }
    a.prototype = f;
    s(y, "constructor", f);
    s(f, "constructor", a);
    a.displayName = "GeneratorFunction";
    s(f, o, "GeneratorFunction");
    s(y);
    s(y, o, "Generator");
    s(y, e, function () {
      return this;
    });
    s(y, "toString", function () {
      return "[object Generator]";
    });
    return (l = function () {
      return {
        w: i,
        m: v
      };
    })();
  }
  function s(t, n, r, e) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (t) {
      o = 0;
    }
    s = function (t, n, r, e) {
      function i(n, r) {
        s(t, n, function (t) {
          return this._invoke(n, r, t);
        });
      }
      if (n) {
        if (o) {
          o(t, n, {
            value: r,
            enumerable: !e,
            configurable: !e,
            writable: !e
          });
        } else {
          t[n] = r;
        }
      } else {
        i("next", 0);
        i("throw", 1);
        i("return", 2);
      }
    };
    s(t, n, r, e);
  }
  function p(t, n) {
    var r = Object.keys(t);
    if (Object.getOwnPropertySymbols) {
      var e = Object.getOwnPropertySymbols(t);
      if (n) {
        e = e.filter(function (n) {
          return Object.getOwnPropertyDescriptor(t, n).enumerable;
        });
      }
      r.push.apply(r, e);
    }
    return r;
  }
  function y(t) {
    for (var n = 1; n < arguments.length; n++) {
      var r = arguments[n] ?? {};
      if (n % 2) {
        p(Object(r), true).forEach(function (n) {
          v(t, n, r[n]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(t, Object.getOwnPropertyDescriptors(r));
      } else {
        p(Object(r)).forEach(function (n) {
          Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
        });
      }
    }
    return t;
  }
  function v(t, n, r) {
    if ((n = function (t) {
      var n = function (t) {
        if (f(t) != "object" || !t) {
          return t;
        }
        var n = t[Symbol.toPrimitive];
        if (n !== undefined) {
          var r = n.call(t, "string");
          if (f(r) != "object") {
            return r;
          }
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return String(t);
      }(t);
      if (f(n) == "symbol") {
        return n;
      } else {
        return n + "";
      }
    }(n)) in t) {
      Object.defineProperty(t, n, {
        value: r,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      t[n] = r;
    }
    return t;
  }
  function b(t, n, r, e, o, i, c) {
    try {
      var u = t[i](c);
      var a = u.value;
    } catch (t) {
      r(t);
      return;
    }
    if (u.done) {
      n(a);
    } else {
      Promise.resolve(a).then(e, o);
    }
  }
  function m(t) {
    return function () {
      var n = this;
      var r = arguments;
      return new Promise(function (e, o) {
        var i = t.apply(n, r);
        function c(t) {
          b(i, e, o, c, u, "next", t);
        }
        function u(t) {
          b(i, e, o, c, u, "throw", t);
        }
        c(undefined);
      });
    };
  }
  var h = {
    1: {
      name: "Alice Johnson",
      role: "admin",
      score: 95
    },
    2: {
      name: "Bob Smith",
      role: "user",
      score: 72
    },
    42: {
      name: "Jane Doe",
      role: "moderator",
      score: 88
    }
  };
  function g(t) {
    return d.apply(this, arguments);
  }
  function d() {
    return (d = m(l().m(function t(n) {
      return l().w(function (t) {
        while (true) {
          if (t.n === 0) {
            return t.a(2, new Promise(function (t, r) {
              setTimeout(function () {
                var e = h[n];
                if (e) {
                  t(y(y({
                    id: n
                  }, e), {}, {
                    fetchedAt: new Date().toISOString()
                  }));
                } else {
                  r(new Error(`User ${n} not found`));
                }
              }, 10);
            }));
          }
        }
      }, t);
    }))).apply(this, arguments);
  }
  function w(t) {
    return O.apply(this, arguments);
  }
  function O() {
    return (O = m(l().m(function t(n) {
      var r;
      var o;
      return l().w(function (t) {
        while (true) {
          switch (t.n) {
            case 0:
              t.n = 1;
              return g(n);
            case 1:
              r = t.v;
              o = e(r.score, 0, 100);
              return t.a(2, {
                displayName: r.name.toUpperCase(),
                memberId: `MEMBER-${r.id}`,
                role: r.role,
                trustScore: o
              });
          }
        }
      }, t);
    }))).apply(this, arguments);
  }
  function j(t) {
    return S.apply(this, arguments);
  }
  function S() {
    return (S = m(l().m(function t(n) {
      var r;
      return l().w(function (t) {
        while (true) {
          switch (t.n) {
            case 0:
              t.n = 1;
              return Promise.all(n.map(g));
            case 1:
              r = t.v;
              return t.a(2, r.map(function (t) {
                return {
                  id: t.id,
                  name: t.name
                };
              }));
          }
        }
      }, t);
    }))).apply(this, arguments);
  }
  function P() {
    var t;
    var n;
    var r = typeof Symbol == "function" ? Symbol : {};
    var e = r.iterator || "@@iterator";
    var o = r.toStringTag || "@@toStringTag";
    function i(r, e, o, i) {
      var a = e && e.prototype instanceof u ? e : u;
      var f = Object.create(a.prototype);
      T(f, "_invoke", function (r, e, o) {
        var i;
        var u;
        var a;
        var f = 0;
        var l = o || [];
        var s = false;
        var p = {
          p: 0,
          n: 0,
          v: t,
          a: y,
          f: y.bind(t, 4),
          d: function (n, r) {
            i = n;
            u = 0;
            a = t;
            p.n = r;
            return c;
          }
        };
        function y(r, e) {
          u = r;
          a = e;
          n = 0;
          for (; !s && f && !o && n < l.length; n++) {
            var o;
            var i = l[n];
            var y = p.p;
            var v = i[2];
            if (r > 3) {
              if (o = v === e) {
                a = i[(u = i[4]) ? 5 : (u = 3, 3)];
                i[4] = i[5] = t;
              }
            } else if (i[0] <= y) {
              if (o = r < 2 && y < i[1]) {
                u = 0;
                p.v = e;
                p.n = i[1];
              } else if (y < v && (o = r < 3 || i[0] > e || e > v)) {
                i[4] = r;
                i[5] = e;
                p.n = v;
                u = 0;
              }
            }
          }
          if (o || r > 1) {
            return c;
          }
          s = true;
          throw e;
        }
        return function (o, l, v) {
          if (f > 1) {
            throw TypeError("Generator is already running");
          }
          if (s && l === 1) {
            y(l, v);
          }
          u = l;
          a = v;
          while ((n = u < 2 ? t : a) || !s) {
            if (!i) {
              if (u) {
                if (u < 3) {
                  if (u > 1) {
                    p.n = -1;
                  }
                  y(u, a);
                } else {
                  p.n = a;
                }
              } else {
                p.v = a;
              }
            }
            try {
              f = 2;
              if (i) {
                if (!u) {
                  o = "next";
                }
                if (n = i[o]) {
                  if (!(n = n.call(i, a))) {
                    throw TypeError("iterator result is not an object");
                  }
                  if (!n.done) {
                    return n;
                  }
                  a = n.value;
                  if (u < 2) {
                    u = 0;
                  }
                } else {
                  if (u === 1 && (n = i.return)) {
                    n.call(i);
                  }
                  if (u < 2) {
                    a = TypeError("The iterator does not provide a '" + o + "' method");
                    u = 1;
                  }
                }
                i = t;
              } else if ((n = (s = p.n < 0) ? a : r.call(e, p)) !== c) {
                break;
              }
            } catch (n) {
              i = t;
              u = 1;
              a = n;
            } finally {
              f = 1;
            }
          }
          return {
            value: n,
            done: s
          };
        };
      }(r, o, i), true);
      return f;
    }
    var c = {};
    function u() {}
    function a() {}
    function f() {}
    n = Object.getPrototypeOf;
    var l = [][e] ? n(n([][e]())) : (T(n = {}, e, function () {
      return this;
    }), n);
    var s = f.prototype = u.prototype = Object.create(l);
    function p(t) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(t, f);
      } else {
        t.__proto__ = f;
        T(t, o, "GeneratorFunction");
      }
      t.prototype = Object.create(s);
      return t;
    }
    a.prototype = f;
    T(s, "constructor", f);
    T(f, "constructor", a);
    a.displayName = "GeneratorFunction";
    T(f, o, "GeneratorFunction");
    T(s);
    T(s, o, "Generator");
    T(s, e, function () {
      return this;
    });
    T(s, "toString", function () {
      return "[object Generator]";
    });
    return (P = function () {
      return {
        w: i,
        m: p
      };
    })();
  }
  function T(t, n, r, e) {
    var o = Object.defineProperty;
    try {
      o({}, "", {});
    } catch (t) {
      o = 0;
    }
    T = function (t, n, r, e) {
      function i(n, r) {
        T(t, n, function (t) {
          return this._invoke(n, r, t);
        });
      }
      if (n) {
        if (o) {
          o(t, n, {
            value: r,
            enumerable: !e,
            configurable: !e,
            writable: !e
          });
        } else {
          t[n] = r;
        }
      } else {
        i("next", 0);
        i("throw", 1);
        i("return", 2);
      }
    };
    T(t, n, r, e);
  }
  function G(t, n, r, e, o, i, c) {
    try {
      var u = t[i](c);
      var a = u.value;
    } catch (t) {
      r(t);
      return;
    }
    if (u.done) {
      n(a);
    } else {
      Promise.resolve(a).then(e, o);
    }
  }
  function E(t, n) {
    var r = n.formatFormal(t.displayName);
    console.log(r);
    console.log(`Role: ${t.role} | Trust Score: ${t.trustScore}`);
    console.log(`Member ID: ${t.memberId}`);
  }
  function _() {
    var t;
    t = P().m(function t() {
      var n;
      var e;
      var o;
      var i;
      var c;
      var f;
      var l;
      return P().w(function (t) {
        while (true) {
          switch (t.n) {
            case 0:
              n = new Date().getHours();
              e = u("World", n);
              console.log(e);
              o = r(5);
              console.log(`Circle area with radius 5: ${o.toFixed(2)}`);
              t.n = 1;
              return w(42);
            case 1:
              i = t.v;
              c = new a("en-US");
              E(i, c);
              t.n = 2;
              return j([1, 2, 42]);
            case 2:
              f = t.v;
              console.log(`Team: ${f.map(function (t) {
                return t.name;
              }).join(", ")}`);
              l = c.getStats();
              console.log(`Sent ${l.totalGreetings} greeting(s) in ${l.locale}`);
            case 3:
              return t.a(2);
          }
        }
      }, t);
    });
    _ = function () {
      var n = this;
      var r = arguments;
      return new Promise(function (e, o) {
        var i = t.apply(n, r);
        function c(t) {
          G(i, e, o, c, u, "next", t);
        }
        function u(t) {
          G(i, e, o, c, u, "throw", t);
        }
        c(undefined);
      });
    };
    return _.apply(this, arguments);
  }
  (function () {
    return _.apply(this, arguments);
  })().catch(console.error);
})(); //# sourceMappingURL=bundle.js.map