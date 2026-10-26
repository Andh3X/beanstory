(function () {
  try {
    var tema = localStorage.getItem("beanstory:tema:v1");
    var gelap = tema === "gelap" || (tema !== "terang" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = gelap ? "gelap" : "terang";
  } catch (_) {
    document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "gelap" : "terang";
  }
})();
