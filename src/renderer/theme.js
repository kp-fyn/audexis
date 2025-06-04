let theme = localStorage.getItem("theme");
if (!theme) {
  theme = "light";
  localStorage.setItem("theme", theme);
}
document.documentElement.setAttribute("class", theme);
