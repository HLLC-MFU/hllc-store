(function () {
  window.CardBottleQR = {
    toSvg(text) {
      if (!window.QRCode?.toString) {
        throw new Error("QR library is not loaded");
      }

      let svg = "";
      window.QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 4,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }, (error, result) => {
        if (error) throw error;
        svg = result;
      });
      return svg;
    },
  };
})();
