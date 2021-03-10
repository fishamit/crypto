// btnAbout

$(() => {
  $(".modalSwitch").hide();
  let arrCoins;
  let arrSelectedCoins = [];
  let graphInterval;

  const chart = () => {
    $(".navBtn").removeClass("active");
    $("#btnReports").addClass("active");
    clearScreen();
    $("#txtSearch").prop("disabled", true);

    if (arrSelectedCoins.length == 0) {
      alert("Select at least one coin to show graph.");
      coins();
      return;
    }
    $(".row").append(
      `<div id="chartContainer" style="width:100%; height:300px;"></div>`
    );

    const chartCoins = [];
    const data = [];
    let strSymbols = "";
    for (coin of arrSelectedCoins) {
      chartCoins.push({
        showInLegend: true,
        type: "line",
        name: coin.symbol,
        dataPoints: [],
      });
      data.push(coin.dataPoints);
      strSymbols += coin.symbol + ",";
    }

    strSymbols = strSymbols.slice(0, -1);
    console.log(strSymbols);

    let x = 0;

    const chart = new CanvasJS.Chart("chartContainer", {
      axisX: {
        title: "Seconds",
        minimum: 0,
        interval: 1,
      },
      axisY: {
        title: "$USD",
        minimum: 0,
      },
      data: chartCoins,
    });

    function addDataPoint() {
      $.get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${strSymbols}&tsyms=USD`,
        (obj) => {
          if (obj.Response == "Error") {
            alert("Information about your selection does not exist.");
            coins();
            return;
          }
          for (coin of chartCoins) {
            if (obj[coin.name.toUpperCase()]) {
              coin.dataPoints.push({
                x: x,
                y: obj[coin.name.toUpperCase()].USD,
              });
            }
          }
          x += 2;
          console.log(obj);

          chart.render();
          graphInterval = setTimeout(addDataPoint, 2000);
        }
      );
    }

    addDataPoint();
  };

  //Handle coins state
  const coins = () => {
    $(".navBtn").removeClass("active");
    $("#btnCoins").addClass("active");
    //init
    localStorage.clear();
    clearInterval(graphInterval);
    $("#txtSearch").prop("disabled", false);
    $(".myModal").show();
    arrCoins = [];
    // arrSelectedCoins = [];

    $.get("https://api.coingecko.com/api/v3/coins/list", (obj) => {
      for (let i = 2000; i < 2050; i++) {
        arrCoins.push({
          id: obj[i].id,
          name: obj[i].name,
          symbol: obj[i].symbol,
        });
      }
      drawCoins(arrCoins);
      $(".myModal").hide();
    });
  };

  const clearScreen = () => {
    $(".row").empty();
  };

  const drawCoins = (array) => {
    clearScreen();
    for (coin of array) {
      const { id, name, symbol } = coin;
      const newCard = createCard(id, name, symbol);
      $(".row").append(newCard);
    }
  };

  const cleanModalSwitch = () => {
    $(".selectedCoinsContainer").empty();
    $(".modal-footer").empty();
    $(".modalSwitch").hide();
    $("body").removeClass("noScroll");
  };

  const selectCoin = (coin) => {
    arrSelectedCoins.push(coin);
  };

  const unselectCoin = (id) => {
    arrSelectedCoins = arrSelectedCoins.filter((element) => element.id != id);
  };

  //Create new card
  const createCard = (id, name, symbol) => {
    const divCardContainer = $("<div></div>")
      .addClass("cardContainer mb-3 col-xxl-3 col-xl-4 col-lg-4 center")
      .attr("id", id);
    const divCard = $("<div></div>").addClass("card shadow");
    const divSwitch = $("<div></div>").addClass(
      "form-check form-switch topRight"
    );
    //Switch
    const switchInput = $("<input></input>")
      .prop({
        type: "checkbox",
        id: "flexSwitchCheckDefault",
      })
      .addClass("form-check-input")
      //Switch event handler
      .on("click", function () {
        let selectionId;
        if ($(this).prop("checked")) {
          if (arrSelectedCoins.length == 5) {
            let tmpStr = "";
            $(".modalSwitch").show();
            $("body").addClass("noScroll");
            for (coin of arrSelectedCoins) {
              const divFormCheck = $("<div></div>").addClass("form-check");
              const input = $("<input></input>")
                .attr({
                  class: "form-check-input swc",
                  type: "radio",
                  name: "selectedCoins",
                  id: coin.id,
                  value: coin.symbol,
                })
                .on("click", function () {
                  selectionId = $(this).attr("id");
                });
              $(".form-check-input swc").first().prop("checked", true);
              const label = $("<label></label>")
                .attr({
                  class: "form-check-label",
                  for: coin.symbol,
                })
                .html(
                  `<span class="bold">${coin.symbol}</span> - ${coin.name}`
                );
              divFormCheck.append(input, label);
              $(".selectedCoinsContainer").append(divFormCheck);
            }

            const btnCancel = $(`<button type="button"></button>`)
              .addClass("btn btn-primary")
              .text("Cancel")
              .on("click", () => {
                cleanModalSwitch();
                $(this).prop("checked", false);
              });
            const btnReplace = $(`<button type="button"></button>`)
              .addClass("btn btn-primary")
              .text("Replace")
              .on("click", () => {
                cleanModalSwitch();

                $(`#${selectionId}`).find("input").prop("checked", false);
                let oldSymbol;

                for (coin of arrCoins) {
                  if (coin.id == selectionId) {
                    unselectCoin(selectionId);
                  }
                }

                selectCoin({ id, name, symbol });
              });

            $(".modal-footer").append(btnCancel, btnReplace);
          } else {
            selectCoin({ id, name, symbol });
          }
        } else {
          unselectCoin(id);
        }
        console.log(arrSelectedCoins);
      });
    for (coin of arrSelectedCoins) {
      if (coin.id == id) {
        switchInput.prop("checked", true);
      }
    }

    const divCardBody = $("<div></div>").addClass("card-body");
    const cardTitle = $("<h5></h5>").addClass("card-title center").text(symbol);
    const cardText = $("<p></p>").addClass("card-text center").text(name);
    const divBtnContainer = $("<div></div>")
      .attr("id", "btnContainer")
      .addClass("btnContainer");

    const btnMoreInfo = $("<button></button>")
      .attr("id", "btnMoreInfo")
      .addClass("btn btn-primary")
      .text("More info")
      .on("click", function () {
        //Check existence in localStorage
        if (!localStorage.getItem(id)) {
          $(this).html(
            `<div class="spinner-border" style="width:1rem; height: 1rem;" role="status"></div>`
          );
          $.get(`https://api.coingecko.com/api/v3/coins/${id}`, (obj) => {
            localStorage.setItem(id, JSON.stringify({ name, symbol }));

            //Handle deletion from localStorage after 120 seconds
            const timeout = setTimeout(() => {
              localStorage.removeItem(id);
              $(this).next().slideUp();
              $(this).text("More info");
            }, 120000);

            $(this).text("Less info");
            $(this).next().html(`
              <div class="infoContainer">
              <div class="center"> <img class="coinIcon" src="${obj.image.small}"></img> </div>
               <div class="center"><ul>
               <li>USD: ${obj.market_data.current_price.usd}$</li>
               <li>EUR: ${obj.market_data.current_price.eur}€</li>
               <li>ILS: ${obj.market_data.current_price.ils}₪</li>
               </ul></div>
              </div>
            `);
            $(this).next().slideToggle();
          });
        } else {
          if ($(this).text() == "More info") $(this).text("Less info");
          else $(this).text("More info");
          $(this).next().slideToggle();
        }
      });

    const divMoreInfo = $("<div></div>").addClass("moreInfo hidden");

    divBtnContainer.append(btnMoreInfo, divMoreInfo);
    divCardBody.append(cardTitle, cardText, divBtnContainer);

    divSwitch.append(switchInput);
    divCard.append(divSwitch, divCardBody);
    divCardContainer.append(divCard);
    return divCardContainer;
  };

  const about = () => {
    clearInterval(graphInterval);
    $(".navBtn").removeClass("active");
    $("#btnAbout").addClass("active");
    clearScreen();
    $("#txtSearch").prop("disabled", true);
    $(".row").append(`
        <div class="col-xl-6 center">
        <div class="jumbotron">
        <h1 class="display-4">About</h1>
        <p class="lead">My name is Amit and this is my second project for JohnBryce. I had a lot of fun building this web app, even though I feel like the code can be cleaner.
        I learned a lot about some of the nastier sides of JavaScript, but also got to see some really cool ones, like the advantages of using arrow functions when you want to use the outer "this"! I enjoyed jQuery but prefer Vanilla JS, and I can't wait to learn modern libraries.
        <hr><b>The bonus question</b> does not work 100% - the API won't recognize some coin symbols. </p>
        </div>
        </div>
        <div class="col-xl-6 center"><img class="round shadow" src="img/sunny.png"></img></div>`);
  };

  $("#txtSearch").on("input", function () {
    console.log($(this).val());
    if ($(this).val() == "") {
      console.log("heya");
      drawCoins(arrCoins);
    } else {
      const arrSearch = arrCoins.filter((element) => {
        console.log($(this).val());
        console.log(element.symbol);
        return element.symbol.startsWith($(this).val());
      });
      console.log(arrSearch);
      drawCoins(arrSearch);
    }
  });

  $("#btnCoins").on("click", () => {
    coins();
  });
  $("#btnAbout").on("click", () => {
    about();
  });

  $("#btnReports").on("click", () => {
    chart();
  });

  coins();
});
