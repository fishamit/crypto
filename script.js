//Project 2 - jQuery - Amit Fisher

$(() => {
  //Global variables
  let arrCoins = [];
  let arrSelectedCoins = [];
  let graphInterval;
  let currentState;
  //Number of current async checks - to prevent selection of more than 5 coins (if API is slow)
  let nAsync = 0;

  /*
  Bonus question - graph
  */
  const chart = () => {
    currentState = "chart";
    $(".navBtn").removeClass("active");
    $("#btnReports").addClass("active");

    clearScreen();
    $("body").removeClass("noScroll");
    $("#txtSearch").fadeOut(200);
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
      strSymbols += coin.symbol + ",";
    }

    strSymbols = strSymbols.slice(0, -1);

    const chart = new CanvasJS.Chart("chartContainer", {
      theme: "light1",
      axisX: {
        title: "Time",
        valueFormatString: "HH:mm:ss",
        intervalType: "second",
        interval: 2,
      },
      axisY: {
        title: "Price ($USD)",
        minimum: 0,
        suffix: "$",
      },
      toolTip: {
        contentFormatter: function (e) {
          const hours = e.entries[0].dataPoint.x.getHours();
          const minutes = e.entries[0].dataPoint.x.getMinutes();
          const seconds = e.entries[0].dataPoint.x.getSeconds();
          const str = `
        <table class="table table-striped table-bordered">
          <tbody>
            <tr>
              <td class="align-middle"><strong>Coin name:</strong></td>
              <td class="align-middle">${e.entries[0].dataSeries.name}</td>
            </tr>
            <tr>
              <td class="align-middle"><strong>Time:</strong></td>
              <td class="align-middle">${createTimeString(
                hours,
                minutes,
                seconds
              )}</td>
            </tr>
            <tr>
              <td class="align-middle"><strong>Price:</strong></td>
              <td class="align-middle">
                ${e.entries[0].dataPoint.y}$
              </td>
            </tr>
            <tr>
          </tbody>
        </table>
          `;
          return str;
        },
        shared: false,
        borderThickness: 3,
        backgroundColor: "rgb(255,255,255)",
      },
      data: chartCoins,
    });

    const update = () => {
      $.get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${strSymbols}&tsyms=USD`,
        obj => {
          const time = new Date();
          for (const coin of chartCoins) {
            if (coin.dataPoints.length > 5) {
              coin.dataPoints.shift();
            }
            if (obj[coin.name.toUpperCase()]) {
              coin.dataPoints.push({
                x: time,
                y: obj[coin.name.toUpperCase()].USD,
              });
            }
          }
          chart.options.axisX.minimum = chartCoins[0].dataPoints[0].x;
          if (firstPass) {
            $(".myModal").fadeOut(200);
            firstPass = false;
          }
          chart.render();
        }
      );
    };
    graphInterval = setInterval(update, 2000);
  };

  //Load coins from api into coins array and call the coins function after.
  const loadCoins = () => {
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
    $("#txtSearch").fadeIn(200);
    $(".myModal").fadeOut(500, drawCoins(arrCoins));
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
    $(".modalSwitch").fadeOut(200);
    $("body").removeClass("noScroll");
  };

  /* 
  Checks if live information about specific coin exists. if it does, it will be selected
  The usage of localStorage here is not related to the "more info" local storage which deletes after 2 minutes. 
  It is done so that there won't be new API calls to cryptocompare on every click.
  
  If this function is called from the "replace" button (when >5 coins are selected),
  a selectionId property will be passed within the coin object and used to deselect the chosen coin and replace with the new one.
  */
  const selectCoin = coin => {
    const local = localStorage.getItem(`isLiveInfo-${coin.id}`);
    //If localStorage has no item, check if live info exists in API and store it in localStorage.
    if (!local) {
      nAsync += 1;
      $(`#${coin.id}`).find("input").hide();
      $(`#${coin.id}`).find(".topRight").append(`
    <div id= "${coin.id}-spinner"class="spinner-border text-primary spinnerSwitch" style="width:1rem; height: 1rem;" role="status"></div>
    `);

      $.get(
        `https://min-api.cryptocompare.com/data/price?fsym=${coin.symbol}&tsyms=USD`,
        res => {
          if (res.Response == "Error") {
            localStorage.setItem(`isLiveInfo-${coin.id}`, "false");
            sendError(`No live information for ${coin.symbol}.`);
            $(`#${coin.id}-spinner`).remove();
            $(`#${coin.id}`).find("input").prop("checked", false);
            $(`#${coin.id}`).find("input").show();
          } else {
            localStorage.setItem(`isLiveInfo-${coin.id}`, "true");
            $(`#${coin.id}-spinner`).remove();
            arrSelectedCoins.push(coin);
            $(`#${coin.id}`).find("input").prop("checked", true);
            $(`#${coin.id}`).find("input").show();
            if (coin.selectionId) {
              $(`#${coin.selectionId}`).find("input").prop("checked", false);
              unselectCoin(coin.selectionId);
            }
          }
          nAsync -= 1;
        }
      );
      //If localStorage info exists, handle accordingly.
    } else {
      if (local == "true") {
        arrSelectedCoins.push(coin);
        $(`#${coin.id}`).find("input").prop("checked", true);
        if (coin.selectionId) {
          $(`#${coin.selectionId}`).find("input").prop("checked", false);
          unselectCoin(coin.selectionId);
        }
      } else {
        sendError(`No live information for ${coin.symbol}, deselecting.`);
        $(`#${coin.id}`).find("input").prop("checked", false);
      }
    }
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
          //check a very specific situation where a user can select 6 coins if a coin is performing an async check.
          if (nAsync + arrSelectedCoins.length >= 5 && nAsync != 0) {
            sendError(
              "Unable to select any more coins until pending coins are selected."
            );
            $(this).prop("checked", false);
            return;
          }
          //Handle switch replacement modal form
          else if (arrSelectedCoins.length == 5) {
            $(".modalSwitch").fadeIn(200);
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
                selectCoin({ id, name, symbol, selectionId });
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
                <div class="center"><img class="coinIcon" src="${obj.img}" alt="coin image"></img></div>
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
    $("#txtSearch").fadeOut(200);
    $(".row").append(`
        <div class="col-xl-6 center">
        <div class="jumbotron">
        <h1 class="display-4">About</h1>
        <p class="lead">My name is Amit and this is my second project for the John Bryce fullstack web developer course. I had a lot of fun building this web app!
        I learned a lot about some of the nastier sides of JavaScript, but also got to see some really cool ones, like the advantages of using arrow functions when you want to use the outer "this"! I enjoyed jQuery but prefer Vanilla JS, and I can't wait to learn modern libraries.
        </p>
        </div>
        </div>
        <div class="col-xl-6 center"><img class="round shadow" src="img/sunny.png" alt="Sunny"></img></div>`);
  };

  const sendError = strError => {
    $("#modalErrorContent").text(strError);
    $("body").addClass("noScroll");
    $(".modalError").fadeIn(200);
  };

  const createTimeString = (...params) => {
    let str = "";
    for (const p of params) {
      str += (p < 10 ? "0" : "") + p + ":";
    }
    return str.slice(0, -1);
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
    if (currentState != "coins") {
      $(".row")
        .fadeOut(200, () => coins())
        .fadeIn(200);
    }
    $("#txtSearch").val("");
  });
  $("#btnAbout").on("click", () => {
    $(".row")
      .fadeOut(200, () => about())
      .fadeIn(200);
  });

  $("#btnReports").on("click", () => {
    if (arrSelectedCoins.length == 0) {
      sendError("Select at least one coin to show graph.");
      return;
    }
    $("body").addClass("noScroll");
    $(".myModal").fadeIn(200);
    $(".row")
      .fadeOut(200, () => chart())
      .fadeIn(200);
  });

  $("#btnModalErrorClose").on("click", () => {
    $(".modalError").fadeOut(200);
    $("body").removeClass("noScroll");
    if (currentState != "coins") coins();
  });

  //Initiate the website
  $(".modalSwitch").hide();
  $(".modalError").hide();
  localStorage.clear();
  loadCoins();
});
