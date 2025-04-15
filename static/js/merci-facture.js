
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("facture-download");

  const pdfUrl = localStorage.getItem("facture_pdf_url");
  const ref = localStorage.getItem("facture_ref");

  if (pdfUrl) {
    const button = document.createElement("a");
    button.href = pdfUrl;
    button.target = "_blank";
    button.className = "btn btn-outline-primary";
    button.innerHTML = `📄 Télécharger votre facture ${ref ? ": " + ref : ""}`;
    container.appendChild(button);
  }
});
