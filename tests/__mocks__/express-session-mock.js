module.exports = () => (req, res, next) => {
  req.session = req.session || {};
  next();
};