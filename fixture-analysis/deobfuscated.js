(function () {
  "use strict";

  function t(__________add, multiply) {
    return __________add + multiply;
  }
  function n(add, multiplier) {
    return add * multiplier;
  }
  function __circleArea(_add) {
    return n(Math.PI, n(_add, _add));
  }
  function clamp(__add, _multiply, circleArea) {
    if (__add < _multiply) {
      return _multiply;
    } else if (__add > circleArea) {
      return circleArea;
    } else {
      return __add;
    }
  }
  function typeOf(___add) {
    if (typeof Symbol == "function" && typeof Symbol.iterator == "symbol") {
      typeOf = function (____add) {
        return typeof ____add;
      };
    } else {
      typeOf = function (_____add) {
        if (
          _____add &&
          typeof Symbol == "function" &&
          _____add.constructor === Symbol &&
          _____add !== Symbol.prototype
        ) {
          return "symbol";
        } else {
          return typeof _____add;
        }
      };
    }
    return typeOf(___add);
  }
  function i(target, descriptors) {
    for (
      var descriptorIndex = 0;
      descriptorIndex < descriptors.length;
      descriptorIndex++
    ) {
      var _descriptor = descriptors[descriptorIndex];
      _descriptor.enumerable = _descriptor.enumerable || false;
      _descriptor.configurable = true;
      if ("value" in _descriptor) {
        _descriptor.writable = true;
      }
      Object.defineProperty(
        target,
        toPropertyKey(_descriptor.key),
        _descriptor,
      );
    }
  }
  function toPropertyKey(key) {
    var _primitiveKey = (function (value) {
      if (typeOf(value) != "object" || !value) {
        return value;
      }
      var _____toPrimitive = value[Symbol.toPrimitive];
      if (_____toPrimitive !== undefined) {
        var __primitiveValue = _____toPrimitive.call(value, "string");
        if (typeOf(__primitiveValue) != "object") {
          return __primitiveValue;
        }
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(value);
    })(key);
    if (typeOf(_primitiveKey) == "symbol") {
      return _primitiveKey;
    } else {
      return _primitiveKey + "";
    }
  }
  function generateGreeting(name, primitiveValue) {
    var timeOfDay = (function (hour) {
      if (hour < 12) {
        return "morning";
      } else if (hour < 18) {
        return "afternoon";
      } else {
        return "evening";
      }
    })(primitiveValue);
    var greetingWordCount = t(2, name.split(" ").length);
    return `Good ${timeOfDay}, ${name}! Your greeting has ${greetingWordCount} words.`;
  }
  var a = (function () {
    _Greeter = function ______add(locale) {
      (function (_______add, __toPrimitive) {
        if (!(_______add instanceof __toPrimitive)) {
          throw new TypeError("Cannot call a class as a function");
        }
      })(this, ______add);
      this.locale = locale;
      this.greetingCount = 0;
    };
    if (
      (prototypeMethodDescriptors = [
        {
          key: "formatFormal",
          value: function (Greeter) {
            this.greetingCount = t(this.greetingCount, 1);
            return `Dear ${Greeter}, greetings from locale ${this.locale}.`;
          },
        },
        {
          key: "getStats",
          value: function () {
            return {
              locale: this.locale,
              totalGreetings: this.greetingCount,
            };
          },
        },
      ])
    ) {
      i(_Greeter.prototype, prototypeMethodDescriptors);
    }
    Object.defineProperty(_Greeter, "prototype", {
      writable: false,
    });
    return _Greeter;
    var _Greeter;
    var prototypeMethodDescriptors;
  })();
  function _typeOf(increment) {
    if (typeof Symbol == "function" && typeof Symbol.iterator == "symbol") {
      _typeOf = function (________add) {
        return typeof ________add;
      };
    } else {
      _typeOf = function (_________add) {
        if (
          _________add &&
          typeof Symbol == "function" &&
          _________add.constructor === Symbol &&
          _________add !== Symbol.prototype
        ) {
          return "symbol";
        } else {
          return typeof _________add;
        }
      };
    }
    return _typeOf(increment);
  }
  function initAsyncGeneratorRuntime() {
    var _undefined;
    var recordIndex;
    var ____Symbol = typeof Symbol == "function" ? Symbol : {};
    var _____iteratorSymbol = ____Symbol.iterator || "@@iterator";
    var __toStringTagSymbol = ____Symbol.toStringTag || "@@toStringTag";
    function i(superClass, iteratorSymbol, toStringTagSymbol, programCounter) {
      var a =
        iteratorSymbol && iteratorSymbol.prototype instanceof noop
          ? iteratorSymbol
          : noop;
      var generatorPrototype = Object.create(a.prototype);
      defineIteratorProperty(
        generatorPrototype,
        "_invoke",
        (function (_Symbol, _iteratorSymbol, _toStringTagSymbol) {
          var i;
          var mode;
          var a;
          var isRunning = 0;
          var _records = _toStringTagSymbol || [];
          var isSuspended = false;
          var generatorContext = {
            p: 0,
            n: 0,
            v: _undefined,
            a: y,
            f: y.bind(_undefined, 4),
            d: function (nextPc, __Symbol) {
              i = nextPc;
              mode = 0;
              a = _undefined;
              generatorContext.n = __Symbol;
              return resumer;
            },
          };
          function y(___Symbol, __iteratorSymbol) {
            mode = ___Symbol;
            a = __iteratorSymbol;
            recordIndex = 0;
            for (
              ;
              !isSuspended &&
              isRunning &&
              !shouldBreak &&
              recordIndex < _records.length;
              recordIndex++
            ) {
              var shouldBreak;
              var i = _records[recordIndex];
              var processRecords = generatorContext.p;
              var nextPosition = i[2];
              if (___Symbol > 3) {
                if ((shouldBreak = nextPosition === __iteratorSymbol)) {
                  a = i[(mode = i[4]) ? 5 : ((mode = 3), 3)];
                  i[4] = i[5] = _undefined;
                }
              } else if (i[0] <= processRecords) {
                if ((shouldBreak = ___Symbol < 2 && processRecords < i[1])) {
                  mode = 0;
                  generatorContext.v = __iteratorSymbol;
                  generatorContext.n = i[1];
                } else if (
                  processRecords < nextPosition &&
                  (shouldBreak =
                    ___Symbol < 3 ||
                    i[0] > __iteratorSymbol ||
                    __iteratorSymbol > nextPosition)
                ) {
                  i[4] = ___Symbol;
                  i[5] = __iteratorSymbol;
                  generatorContext.n = nextPosition;
                  mode = 0;
                }
              }
            }
            if (shouldBreak || ___Symbol > 1) {
              return resumer;
            }
            isSuspended = true;
            throw __iteratorSymbol;
          }
          return function (matchFound, records, endIndex) {
            if (isRunning > 1) {
              throw TypeError("Generator is already running");
            }
            if (isSuspended && records === 1) {
              y(records, endIndex);
            }
            mode = records;
            a = endIndex;
            while ((recordIndex = mode < 2 ? _undefined : a) || !isSuspended) {
              if (!i) {
                if (mode) {
                  if (mode < 3) {
                    if (mode > 1) {
                      generatorContext.n = -1;
                    }
                    y(mode, a);
                  } else {
                    generatorContext.n = a;
                  }
                } else {
                  generatorContext.v = a;
                }
              }
              try {
                isRunning = 2;
                if (i) {
                  if (!mode) {
                    matchFound = "next";
                  }
                  if ((recordIndex = i[matchFound])) {
                    if (!(recordIndex = recordIndex.call(i, a))) {
                      throw TypeError("iterator result is not an object");
                    }
                    if (!recordIndex.done) {
                      return recordIndex;
                    }
                    a = recordIndex.value;
                    if (mode < 2) {
                      mode = 0;
                    }
                  } else {
                    if (mode === 1 && (recordIndex = i.return)) {
                      recordIndex.call(i);
                    }
                    if (mode < 2) {
                      a = TypeError(
                        "The iterator does not provide a '" +
                          matchFound +
                          "' method",
                      );
                      mode = 1;
                    }
                  }
                  i = _undefined;
                } else if (
                  (recordIndex = (isSuspended = generatorContext.n < 0)
                    ? a
                    : _Symbol.call(_iteratorSymbol, generatorContext)) !==
                  resumer
                ) {
                  break;
                }
              } catch (_______________error) {
                i = _undefined;
                mode = 1;
                a = _______________error;
              } finally {
                isRunning = 1;
              }
            }
            return {
              value: recordIndex,
              done: isSuspended,
            };
          };
        })(superClass, toStringTagSymbol, programCounter),
        true,
      );
      return generatorPrototype;
    }
    var resumer = {};
    function noop() {}
    function a() {}
    function emptyFunction() {}
    recordIndex = Object.getPrototypeOf;
    var _state = [][_____iteratorSymbol]
      ? recordIndex(recordIndex([][_____iteratorSymbol]()))
      : (defineIteratorProperty(
          (recordIndex = {}),
          _____iteratorSymbol,
          function () {
            return this;
          },
        ),
        recordIndex);
    var resultHandler =
      (emptyFunction.prototype =
      noop.prototype =
        Object.create(_state));
    function initializeGeneratorFunction(prevIterator) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(prevIterator, emptyFunction);
      } else {
        prevIterator.__proto__ = emptyFunction;
        defineIteratorProperty(
          prevIterator,
          __toStringTagSymbol,
          "GeneratorFunction",
        );
      }
      prevIterator.prototype = Object.create(resultHandler);
      return prevIterator;
    }
    a.prototype = emptyFunction;
    defineIteratorProperty(resultHandler, "constructor", emptyFunction);
    defineIteratorProperty(emptyFunction, "constructor", a);
    a.displayName = "GeneratorFunction";
    defineIteratorProperty(
      emptyFunction,
      __toStringTagSymbol,
      "GeneratorFunction",
    );
    defineIteratorProperty(resultHandler);
    defineIteratorProperty(resultHandler, __toStringTagSymbol, "Generator");
    defineIteratorProperty(resultHandler, _____iteratorSymbol, function () {
      return this;
    });
    defineIteratorProperty(resultHandler, "toString", function () {
      return "[object Generator]";
    });
    return (initAsyncGeneratorRuntime = function () {
      return {
        w: i,
        m: initializeGeneratorFunction,
      };
    })();
  }
  function defineIteratorProperty(
    prevInfo,
    getPrototypeOf,
    iteratorResult,
    ___iteratorSymbol,
  ) {
    var _defineProperty = Object.defineProperty;
    try {
      _defineProperty({}, "", {});
    } catch (t) {
      _defineProperty = 0;
    }
    defineIteratorProperty = function (
      _prevIterator,
      _getPrototypeOf,
      generatorStep,
      ____iteratorSymbol,
    ) {
      function i(__getPrototypeOf, _iteratorResult) {
        defineIteratorProperty(
          _prevIterator,
          __getPrototypeOf,
          function (stepType) {
            return this._invoke(__getPrototypeOf, _iteratorResult, stepType);
          },
        );
      }
      if (_getPrototypeOf) {
        if (_defineProperty) {
          _defineProperty(_prevIterator, _getPrototypeOf, {
            value: generatorStep,
            enumerable: !____iteratorSymbol,
            configurable: !____iteratorSymbol,
            writable: !____iteratorSymbol,
          });
        } else {
          _prevIterator[_getPrototypeOf] = generatorStep;
        }
      } else {
        i("next", 0);
        i("throw", 1);
        i("return", 2);
      }
    };
    defineIteratorProperty(
      prevInfo,
      getPrototypeOf,
      iteratorResult,
      ___iteratorSymbol,
    );
  }
  function ownKeys(error, next) {
    var _keys = Object.keys(error);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(error);
      if (next) {
        symbols = symbols.filter(function (previousIterator) {
          return Object.getOwnPropertyDescriptor(error, previousIterator)
            .enumerable;
        });
      }
      _keys.push.apply(_keys, symbols);
    }
    return _keys;
  }
  function y(_error) {
    for (
      var argumentIndex = 1;
      argumentIndex < arguments.length;
      argumentIndex++
    ) {
      var properties = arguments[argumentIndex] ?? {};
      if (argumentIndex % 2) {
        ownKeys(Object(properties), true).forEach(function (_next) {
          defineErrorProperty(_error, _next, properties[_next]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(
          _error,
          Object.getOwnPropertyDescriptors(properties),
        );
      } else {
        ownKeys(Object(properties)).forEach(function (defineIteratorMethods) {
          Object.defineProperty(
            _error,
            defineIteratorMethods,
            Object.getOwnPropertyDescriptor(properties, defineIteratorMethods),
          );
        });
      }
    }
    return _error;
  }
  function defineErrorProperty(__error, defineGeneratorMethods, errorKeys) {
    if (
      (defineGeneratorMethods = (function (___error) {
        var ___toPrimitive = (function (____error) {
          if (_typeOf(____error) != "object" || !____error) {
            return ____error;
          }
          var ____toPrimitive = ____error[Symbol.toPrimitive];
          if (____toPrimitive !== undefined) {
            var _primitiveValue = ____toPrimitive.call(____error, "string");
            if (_typeOf(_primitiveValue) != "object") {
              return _primitiveValue;
            }
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return String(____error);
        })(___error);
        if (_typeOf(___toPrimitive) == "symbol") {
          return ___toPrimitive;
        } else {
          return ___toPrimitive + "";
        }
      })(defineGeneratorMethods)) in __error
    ) {
      Object.defineProperty(__error, defineGeneratorMethods, {
        value: errorKeys,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      __error[defineGeneratorMethods] = errorKeys;
    }
    return __error;
  }
  function iteratorStep(
    copyPrototypeMethods,
    argIndex,
    keys,
    propertySymbols,
    descriptor,
    defineIteratorMethod,
    _defineIteratorMethods,
  ) {
    try {
      var iteratorMethodDescriptor = copyPrototypeMethods[defineIteratorMethod](
        _defineIteratorMethods,
      );
      var a = iteratorMethodDescriptor.value;
    } catch (_________________error) {
      keys(_________________error);
      return;
    }
    if (iteratorMethodDescriptor.done) {
      argIndex(a);
    } else {
      Promise.resolve(a).then(propertySymbols, descriptor);
    }
  }
  function promisifyGenerator(_target) {
    return function () {
      var __self = this;
      var _args = arguments;
      return new Promise(function (ownPropertyNames, object) {
        var i = _target.apply(__self, _args);
        function iteratorNext(__target) {
          iteratorStep(
            i,
            ownPropertyNames,
            object,
            iteratorNext,
            iteratorThrow,
            "next",
            __target,
          );
        }
        function iteratorThrow(primitiveResult) {
          iteratorStep(
            i,
            ownPropertyNames,
            object,
            iteratorNext,
            iteratorThrow,
            "throw",
            primitiveResult,
          );
        }
        iteratorNext(undefined);
      });
    };
  }
  var h = {
    1: {
      name: "Alice Johnson",
      role: "admin",
      score: 95,
    },
    2: {
      name: "Bob Smith",
      role: "user",
      score: 72,
    },
    42: {
      name: "Jane Doe",
      role: "moderator",
      score: 88,
    },
  };
  function fetchUserProxy(toPrimitiveResult) {
    return fetchUser.apply(this, arguments);
  }
  function fetchUser() {
    return (fetchUser = promisifyGenerator(
      initAsyncGeneratorRuntime().m(function primitiveKey(toPrimitive) {
        return initAsyncGeneratorRuntime().w(function (propertyKey) {
          while (true) {
            if (propertyKey.n === 0) {
              return propertyKey.a(
                2,
                new Promise(function (_toPrimitive, _primitiveResult) {
                  setTimeout(function () {
                    var __user = h[toPrimitive];
                    if (__user) {
                      _toPrimitive(
                        y(
                          y(
                            {
                              id: toPrimitive,
                            },
                            __user,
                          ),
                          {},
                          {
                            fetchedAt: new Date().toISOString(),
                          },
                        ),
                      );
                    } else {
                      _primitiveResult(
                        new Error(`User ${toPrimitive} not found`),
                      );
                    }
                  }, 10);
                }),
              );
            }
          }
        }, primitiveKey);
      }),
    )).apply(this, arguments);
  }
  function getMemberProfileWrapper(_____error) {
    return getMemberProfile.apply(this, arguments);
  }
  function getMemberProfile() {
    return (getMemberProfile = promisifyGenerator(
      initAsyncGeneratorRuntime().m(function ______error(self) {
        var member;
        var __trustScore;
        return initAsyncGeneratorRuntime().w(function (_______error) {
          while (true) {
            switch (_______error.n) {
              case 0: {
                _______error.n = 1;
                return fetchUserProxy(self);
              }
              case 1: {
                member = _______error.v;
                __trustScore = clamp(member.score, 0, 100);
                return _______error.a(2, {
                  displayName: member.name.toUpperCase(),
                  memberId: `MEMBER-${member.id}`,
                  role: member.role,
                  trustScore: __trustScore,
                });
              }
            }
          }
        }, ______error);
      }),
    )).apply(this, arguments);
  }
  function getUsersProxy(________error) {
    return getUsers.apply(this, arguments);
  }
  function getUsers() {
    return (getUsers = promisifyGenerator(
      initAsyncGeneratorRuntime().m(function _________error(_self) {
        var users;
        return initAsyncGeneratorRuntime().w(function (userId) {
          while (true) {
            switch (userId.n) {
              case 0: {
                userId.n = 1;
                return Promise.all(_self.map(fetchUserProxy));
              }
              case 1: {
                users = userId.v;
                return userId.a(
                  2,
                  users.map(function (_userId) {
                    return {
                      id: _userId.id,
                      name: _userId.name,
                    };
                  }),
                );
              }
            }
          }
        }, _________error);
      }),
    )).apply(this, arguments);
  }
  function regeneratorRuntime() {
    var awaitResult;
    var stepIndex;
    var _____Symbol = typeof Symbol == "function" ? Symbol : {};
    var ______iteratorSymbol = _____Symbol.iterator || "@@iterator";
    var ___toStringTagSymbol = _____Symbol.toStringTag || "@@toStringTag";
    function i(resolve, cachedUser, usersById, i) {
      var a =
        cachedUser && cachedUser.prototype instanceof _noop
          ? cachedUser
          : _noop;
      var userInstance = Object.create(a.prototype);
      __defineIteratorMethods(
        userInstance,
        "_invoke",
        (function (reject, user, __userId) {
          var i;
          var operationType;
          var a;
          var continueFlag = 0;
          var userLevels = __userId || [];
          var isStopped = false;
          var levelProcessor = {
            p: 0,
            n: 0,
            v: awaitResult,
            a: y,
            f: y.bind(awaitResult, 4),
            d: function (state, result) {
              i = state;
              operationType = 0;
              a = awaitResult;
              levelProcessor.n = result;
              return continueSentinel;
            },
          };
          function y(scoreData, _user) {
            operationType = scoreData;
            a = _user;
            stepIndex = 0;
            for (
              ;
              !isStopped &&
              continueFlag &&
              !levelMatched &&
              stepIndex < userLevels.length;
              stepIndex++
            ) {
              var levelMatched;
              var i = userLevels[stepIndex];
              var y = levelProcessor.p;
              var maxLevel = i[2];
              if (scoreData > 3) {
                if ((levelMatched = maxLevel === _user)) {
                  a = i[(operationType = i[4]) ? 5 : ((operationType = 3), 3)];
                  i[4] = i[5] = awaitResult;
                }
              } else if (i[0] <= y) {
                if ((levelMatched = scoreData < 2 && y < i[1])) {
                  operationType = 0;
                  levelProcessor.v = _user;
                  levelProcessor.n = i[1];
                } else if (
                  y < maxLevel &&
                  (levelMatched =
                    scoreData < 3 || i[0] > _user || _user > maxLevel)
                ) {
                  i[4] = scoreData;
                  i[5] = _user;
                  levelProcessor.n = maxLevel;
                  operationType = 0;
                }
              }
            }
            if (levelMatched || scoreData > 1) {
              return continueSentinel;
            }
            isStopped = true;
            throw _user;
          }
          return function (trustScore, createGeneratorContext, _value) {
            if (continueFlag > 1) {
              throw TypeError("Generator is already running");
            }
            if (isStopped && createGeneratorContext === 1) {
              y(createGeneratorContext, _value);
            }
            operationType = createGeneratorContext;
            a = _value;
            while (
              (stepIndex = operationType < 2 ? awaitResult : a) ||
              !isStopped
            ) {
              if (!i) {
                if (operationType) {
                  if (operationType < 3) {
                    if (operationType > 1) {
                      levelProcessor.n = -1;
                    }
                    y(operationType, a);
                  } else {
                    levelProcessor.n = a;
                  }
                } else {
                  levelProcessor.v = a;
                }
              }
              try {
                continueFlag = 2;
                if (i) {
                  if (!operationType) {
                    trustScore = "next";
                  }
                  if ((stepIndex = i[trustScore])) {
                    if (!(stepIndex = stepIndex.call(i, a))) {
                      throw TypeError("iterator result is not an object");
                    }
                    if (!stepIndex.done) {
                      return stepIndex;
                    }
                    a = stepIndex.value;
                    if (operationType < 2) {
                      operationType = 0;
                    }
                  } else {
                    if (operationType === 1 && (stepIndex = i.return)) {
                      stepIndex.call(i);
                    }
                    if (operationType < 2) {
                      a = TypeError(
                        "The iterator does not provide a '" +
                          trustScore +
                          "' method",
                      );
                      operationType = 1;
                    }
                  }
                  i = awaitResult;
                } else if (
                  (stepIndex = (isStopped = levelProcessor.n < 0)
                    ? a
                    : reject.call(user, levelProcessor)) !== continueSentinel
                ) {
                  break;
                }
              } catch (________________error) {
                i = awaitResult;
                operationType = 1;
                a = ________________error;
              } finally {
                continueFlag = 1;
              }
            }
            return {
              value: stepIndex,
              done: isStopped,
            };
          };
        })(resolve, usersById, i),
        true,
      );
      return userInstance;
    }
    var continueSentinel = {};
    function _noop() {}
    function a() {}
    function _emptyFunction() {}
    stepIndex = Object.getPrototypeOf;
    var args = [][______iteratorSymbol]
      ? stepIndex(stepIndex([][______iteratorSymbol]()))
      : (__defineIteratorMethods(
          (stepIndex = {}),
          ______iteratorSymbol,
          function () {
            return this;
          },
        ),
        stepIndex);
    var done =
      (_emptyFunction.prototype =
      _noop.prototype =
        Object.create(args));
    function resetGeneratorFunctionConstructor(resetValue) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(resetValue, _emptyFunction);
      } else {
        resetValue.__proto__ = _emptyFunction;
        __defineIteratorMethods(
          resetValue,
          ___toStringTagSymbol,
          "GeneratorFunction",
        );
      }
      resetValue.prototype = Object.create(done);
      return resetValue;
    }
    a.prototype = _emptyFunction;
    __defineIteratorMethods(done, "constructor", _emptyFunction);
    __defineIteratorMethods(_emptyFunction, "constructor", a);
    a.displayName = "GeneratorFunction";
    __defineIteratorMethods(
      _emptyFunction,
      ___toStringTagSymbol,
      "GeneratorFunction",
    );
    __defineIteratorMethods(done);
    __defineIteratorMethods(done, ___toStringTagSymbol, "Generator");
    __defineIteratorMethods(done, ______iteratorSymbol, function () {
      return this;
    });
    __defineIteratorMethods(done, "toString", function () {
      return "[object Generator]";
    });
    return (regeneratorRuntime = function () {
      return {
        w: i,
        m: resetGeneratorFunctionConstructor,
      };
    })();
  }
  function __defineIteratorMethods(
    resumeValue,
    nextIndex,
    _result,
    __________error,
  ) {
    var __defineProperty = Object.defineProperty;
    try {
      __defineProperty({}, "", {});
    } catch (t) {
      __defineProperty = 0;
    }
    __defineIteratorMethods = function (
      __result,
      delegateMethod,
      generator,
      ___________error,
    ) {
      function i(___result, _generatorStep) {
        __defineIteratorMethods(__result, ___result, function (delegateResult) {
          return this._invoke(___result, _generatorStep, delegateResult);
        });
      }
      if (delegateMethod) {
        if (__defineProperty) {
          __defineProperty(__result, delegateMethod, {
            value: generator,
            enumerable: !___________error,
            configurable: !___________error,
            writable: !___________error,
          });
        } else {
          __result[delegateMethod] = generator;
        }
      } else {
        i("next", 0);
        i("throw", 1);
        i("return", 2);
      }
    };
    __defineIteratorMethods(resumeValue, nextIndex, _result, __________error);
  }
  function asyncGeneratorStep(
    methodName,
    __iteratorResult,
    _methodName,
    ____________error,
    __methodName,
    iterator,
    methodKey,
  ) {
    try {
      var ___iteratorResult = methodName[iterator](methodKey);
      var a = ___iteratorResult.value;
    } catch (__________________error) {
      _methodName(__________________error);
      return;
    }
    if (___iteratorResult.done) {
      __iteratorResult(a);
    } else {
      Promise.resolve(a).then(____________error, __methodName);
    }
  }
  function logGeneratorProfile(generatorIterator, ____result) {
    var formattedDisplayName = ____result.formatFormal(
      generatorIterator.displayName,
    );
    console.log(formattedDisplayName);
    console.log(
      `Role: ${generatorIterator.role} | Trust Score: ${generatorIterator.trustScore}`,
    );
    console.log(`Member ID: ${generatorIterator.memberId}`);
  }
  function runDemo() {
    var _generatorContext;
    _generatorContext = regeneratorRuntime().m(function _trustScore() {
      var currentHour;
      var greeting;
      var _circleArea;
      var i;
      var localeFormatter;
      var teamMembers;
      var unusedVariable;
      return regeneratorRuntime().w(function (generatorRunner) {
        while (true) {
          switch (generatorRunner.n) {
            case 0: {
              currentHour = new Date().getHours();
              greeting = generateGreeting("World", currentHour);
              console.log(greeting);
              _circleArea = __circleArea(5);
              console.log(
                `Circle area with radius 5: ${_circleArea.toFixed(2)}`,
              );
              generatorRunner.n = 1;
              return getMemberProfileWrapper(42);
            }
            case 1: {
              i = generatorRunner.v;
              localeFormatter = new a("en-US");
              logGeneratorProfile(i, localeFormatter);
              generatorRunner.n = 2;
              return getUsersProxy([1, 2, 42]);
            }
            case 2: {
              teamMembers = generatorRunner.v;
              console.log(
                `Team: ${teamMembers
                  .map(function (_generator) {
                    return _generator.name;
                  })
                  .join(", ")}`,
              );
              unusedVariable = localeFormatter.getStats();
              console.log(
                `Sent ${unusedVariable.totalGreetings} greeting(s) in ${unusedVariable.locale}`,
              );
            }
            case 3: {
              return generatorRunner.a(2);
            }
          }
        }
      }, _trustScore);
    });
    runDemo = function () {
      var thisArg = this;
      var __args = arguments;
      return new Promise(function (symbolIterator, defineProperty) {
        var i = _generatorContext.apply(thisArg, __args);
        function nextHandler(_____________error) {
          asyncGeneratorStep(
            i,
            symbolIterator,
            defineProperty,
            nextHandler,
            throwHandler,
            "next",
            _____________error,
          );
        }
        function throwHandler(______________error) {
          asyncGeneratorStep(
            i,
            symbolIterator,
            defineProperty,
            nextHandler,
            throwHandler,
            "throw",
            ______________error,
          );
        }
        nextHandler(undefined);
      });
    };
    return runDemo.apply(this, arguments);
  }
  (function () {
    return runDemo.apply(this, arguments);
  })().catch(console.error);
})();
