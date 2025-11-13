const theme = localStorage.getItem("theme");
if (
  theme === "dark" ||
  (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.backgroundColor = "#0a0a0a";
  document.body.style.backgroundColor = "#0a0a0a";
} else {
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.style.backgroundColor = "#f1f1f1";
  document.body.style.backgroundColor = "#f1f1f1";
}
