//Project 2 - jQuery - Amit Fisher

$(() => {
  //Global variables
  let arrCoins = [];
  let arrSelectedCoins = [];
  let graphInterval;
  let currentState;

  /*
  Bonus question - graph
  */
  const chart = () => {
    currentState = "chart";
    $(".navBtn").removeClass("active");
    $("#btnReports").addClass("active");

    clearScreen();
    $("#txtSearch").hide();
    $(".row").append(
      `<div class="center"><div id="chartContainer" style="width:90%; height:500px;"></div></div>`
    );

    //create array of coins for rendering on the graph
    let firstPass = true;
    const chartCoins = [];
    let strSymbols = "";
    for (const coin of arrSelectedCoins) {
      chartCoins.push({
        showInLegend: true,
        type: "line",
        name: coin.symbol,
        dataPoints: [],
      });
      //API string
      strSymbols += coin.symbol + ",";
    }

    strSymbols = strSymbols.slice(0, -1);

    //x-axis(seconds)
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
        obj => {
          for (const coin of chartCoins) {
            if (obj[coin.name.toUpperCase()]) {
              coin.dataPoints.push({
                x: x,
                y: obj[coin.name.toUpperCase()].USD,
              });
            }
          }
          if (firstPass) {
            $(".myModal").hide();
            firstPass = false;
          }
          x += 2;
          chart.render();

          graphInterval = setTimeout(addDataPoint, 2000);
        }
      );
    }
    addDataPoint();
  };

  //Load coins from api into coins array and call the coins function after.
  const loadCoins = () => {
    $(".myModal").show();
    $.get("https://api.coingecko.com/api/v3/coins/list", obj => {
      for (let i = 1; i < 50; i++) {
        //Starting at 1 because sometimes the first element has no img.
        arrCoins.push({
          id: obj[i].id,
          name: obj[i].name,
          symbol: obj[i].symbol,
        });
      }
      coins();
    });
  };

  /*
  Handle the coins page
  */
  const coins = () => {
    currentState = "coins";
    $(".navBtn").removeClass("active");
    $("#btnCoins").addClass("active");
    clearInterval(graphInterval);
    $("#txtSearch").show();
    $(".myModal").hide();
    drawCoins(arrCoins);
  };

  const clearScreen = () => {
    $(".row").empty();
  };

  const drawCoins = array => {
    clearScreen();
    for (const coin of array) {
      const { id, name, symbol } = coin;
      const newCard = createCard(id, name, symbol);
      $(".row").append(newCard);
    }
  };

  const cleanModalSwitch = () => {
    $(".selectedCoinsContainer").empty();
    $(".modal-footer.footerswitch").empty();
    $(".modalSwitch").hide();
    $("body").removeClass("noScroll");
  };

  /*Checks if live information about specific coin exists. if it does, it will be selected*/
  const selectCoin = coin => {
    $.get(
      `https://min-api.cryptocompare.com/data/price?fsym=${coin.symbol}&tsyms=USD`,
      res => {
        if (res.Response == "Error") {
          sendError(`No live information for ${coin.symbol}, deselecting.`);
          $(`#${coin.id}`).find("input").prop("checked", false);
        } else {
          arrSelectedCoins.push(coin);
        }
      }
    );
  };

  const unselectCoin = id => {
    arrSelectedCoins = arrSelectedCoins.filter(element => element.id != id);
  };

  /*
  Handle creation of new coin card element
  */
  const createCard = (id, name, symbol) => {
    const divCardContainer = $("<div></div>")
      .addClass("cardContainer mb-3 col-xxl-3 col-xl-4 col-lg-4 center")
      .attr("id", id);
    const divCard = $("<div></div>").addClass("card shadow");
    const divSwitch = $("<div></div>").addClass(
      "form-check form-switch topRight"
    );
    //Handle switch toggle behavior
    const switchInput = $("<input></input>")
      .prop({
        type: "checkbox",
        id: "flexSwitchCheckDefault",
      })
      .addClass("form-check-input")
      .on("click", function () {
        let selectionId;
        if ($(this).prop("checked")) {
          //Handle switch replacement modal form
          if (arrSelectedCoins.length == 5) {
            $(".modalSwitch").show();
            $("body").addClass("noScroll");
            for (const coin of arrSelectedCoins) {
              const divFormCheck = $("<div></div>").addClass("form-check");
              //Checkbox for selecting coin to replace
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
                  $("#btnReplace").prop("disabled", false);
                  $(`.toReplace`).empty();
                  $(`#toReplace${coin.id}`).text("Will be deselected!");
                });

              selectionId = $(".form-check-input, .swc").first().attr("id");
              const label = $("<label></label>")
                .attr({
                  class: "form-check-label",
                  for: coin.symbol,
                })
                .html(
                  `<span class="bold">${coin.symbol}</span> - ${coin.name} <span class="toReplace" id="toReplace${coin.id}"></span>`
                );
              divFormCheck.append(input, label);
              $(".selectedCoinsContainer").append(divFormCheck);
            }
            //Cancel button
            const btnCancel = $(`<button type="button"></button>`)
              .addClass("btn btn-secondary")
              .text("Cancel")
              .on("click", () => {
                cleanModalSwitch();
                $(this).prop("checked", false);
              });
            //Replace button
            const btnReplace = $(
              `<button type="button" id="btnReplace"></button>`
            )
              .addClass("btn btn-primary")
              .prop("disabled", true)
              .text("Replace")
              .on("click", () => {
                cleanModalSwitch();
                $(`#${selectionId}`).find("input").prop("checked", false);
                for (const coin of arrCoins) {
                  if (coin.id == selectionId) {
                    unselectCoin(selectionId);
                  }
                }
                selectCoin({ id, name, symbol });
              });

            $(".modal-footer.footerswitch").append(btnCancel, btnReplace);
          } else {
            selectCoin({ id, name, symbol });
          }
        } else {
          unselectCoin(id);
        }
      });
    for (const coin of arrSelectedCoins) {
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

    //Handle more info button
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
          $.get(`https://api.coingecko.com/api/v3/coins/${id}`, obj => {
            localStorage.setItem(
              id,
              JSON.stringify({
                img: obj.image.small,
                usd: obj.market_data.current_price.usd,
                eur: obj.market_data.current_price.eur,
                ils: obj.market_data.current_price.ils,
              })
            );

            //Handle deletion from localStorage after 120 seconds
            const timeout = setTimeout(() => {
              localStorage.removeItem(id);
              $(this).next().slideUp();
              $(this).text("More info");
            }, 120000);

            //add more info
            $(this).text("Less info");
            $(this)
              .next()
              .html(getMoreInfoString(JSON.parse(localStorage.getItem(id))));
            $(this).next().slideToggle();
          });
          //handle more info if it exists in localstorage
        } else {
          if ($(this).text() == "More info") {
            $(this).next().empty();
            $(this)
              .next()
              .html(getMoreInfoString(JSON.parse(localStorage.getItem(id))));
            $(this).text("Less info");
          } else {
            $(this).text("More info");
          }
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

  const getMoreInfoString = obj => {
    return `
              <div class="infoContainer">
              <div class="center"> <img class="coinIcon" src="${obj.img}" alt="coin image"></img> </div>
              <div class="center"><ul>
              <li>USD: ${obj.usd}$</li>
              <li>EUR: ${obj.eur}€</li>
              <li>ILS: ${obj.ils}₪</li>
              </ul></div>
              </div>
    `;
  };

  /*
  About page
  */
  const about = () => {
    currentState = "about";
    clearInterval(graphInterval);
    $(".navBtn").removeClass("active");
    $("#btnAbout").addClass("active");
    clearScreen();
    $("#txtSearch").hide();
    $(".row").append(`
        <div class="col-xl-6 center">
        <div class="jumbotron">
        <h1 class="display-4">About</h1>
        <p class="lead">My name is Amit and this is my second project for the John Bryce fullstack web developer course. I had a lot of fun building this web app!
        I learned a lot about some of the nastier sides of JavaScript, but also got to see some really cool ones, like the advantages of using arrow functions when you want to use the outer "this"! I enjoyed jQuery but prefer Vanilla JS, and I can't wait to learn modern libraries.
        </div>
        </div>
        <div class="col-xl-6 center"><img class="round shadow" src="img/sunny.png" alt="Sunny"></img></div>`);
  };

  const sendError = strError => {
    $("#modalErrorContent").text(strError);
    $("body").addClass("noScroll");
    $(".modalError").show();
  };

  //Event listeners:
  $("#txtSearch").on("input", function () {
    if ($(this).val() == "") {
      drawCoins(arrCoins);
    } else {
      const arrSearch = arrCoins.filter(element => {
        return element.symbol
          .toLowerCase()
          .startsWith($(this).val().toLowerCase());
      });
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
    if (arrSelectedCoins.length == 0) {
      sendError("Select at least one coin to show graph.");
      return;
    }
    $(".myModal").show();
    chart();
  });

  $("#btnModalErrorClose").on("click", () => {
    $(".modalError").hide();
    $("body").removeClass("noScroll");
    if (currentState != "coins") coins();
  });

  //Initiate the website
  $(".modalSwitch").hide();
  $(".modalError").hide();
  localStorage.clear();
  loadCoins();
});
