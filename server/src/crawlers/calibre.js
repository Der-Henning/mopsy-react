module.exports = (postData) => {
  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }
  postData({
    message: 1,
    progress: 0.33,
    timeleft: 2
  });
  sleep(1000);
  postData({
    message: 2,
    progress: 0.66,
    timeleft: 1
  });

  sleep(1000);

  postData({
    message: 3,
    progress: 1,
    timeleft: 0
  });

  throw new Error("fehler");
};
