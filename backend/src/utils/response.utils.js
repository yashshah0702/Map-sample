exports.success = function (res, code, message, data) {
  return res.status(code).json({
    message,
    status: "Success",
    code,
    data,
  });
};

exports.failure = function (res, code, message, data) {
  return res.status(code).json({
    message,
    status: "Failure",
    code,
    data,
  });
};
