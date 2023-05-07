// This file contains all code for the map.html subpage.

// jQuery wrapper to only load JavaScript when HTML is fully loaded
$(document).ready(() => {

  // Global array with the Objects holding gonfaloni info so it can be accessed later
  const regionObjects = [];
  // How to log objects so you can see the content:
  //console.log('regionObjects: ' + JSON.stringify(regionObjects)) 

  // Get data for annotations from JSON here so it runs just once, not every time a checkbox is checked. The code to access the JSON file and reformat the pointsString was partly written by ChatGPT and edited by me.
  $.getJSON('assets/map-annotation-gonfaloni.json', function (data) {


    // Loop through each region in the JSON file
    for (const region of data.regions) {
      const allPointsX = region.shape_attributes.all_points_x;
      const allPointsY = region.shape_attributes.all_points_y;

      // Calculate the middle point of a region so we can put descriptive text there.
      let avgX = 0, avgY = 0, length = allPointsX.length;
      for (let i = 0; i < length; i++) {
        avgX += allPointsX[i];
        avgY += allPointsY[i];
      }
      var middlePoint = `x="${avgX / length}" y="${avgY / length}"`;
      // XX figure out better placement some other time

      // Combine the all_points_x and all_points_y arrays into a single string. 
      const pointsString = allPointsX.map((x, i) => `${x},${allPointsY[i]}`).join(' ');

      // Create an object for the region with its name and formatted points string
      const regionObj = {
        name: region.region_attributes.name,
        type: region.region_attributes.type,
        avgWealth: region.region_attributes.avgwealth,
        points: pointsString,
        middle: middlePoint
      };

      // Add the region object to the array
      regionObjects.push(regionObj);

    }
  });
  // as soon as I use another file i get an error in the browser. To solve I set up a local testing server: https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server
  // to run this page in local server right-click HTML and select Launch in Browser (intro to extension in VSCode: https://marketplace.visualstudio.com/items?itemName=yuichinukiyama.vscode-preview-server&ssr=false#overview)


  // insert image in html ("prepend" puts the entity first in the container)
  //$('#oldmap-container').prepend($('<img>', { id: 'oldmap', src: 'images/basicmap.jpg' }))



  // function to add annotation regions based on coordinates in map-annotation-gonfaloni.json
  function mapAnnotations(planNr, jsonFilePath) {
    $('input[id="' + planNr + '"]').click(function () {
      // initialize ID for the region overlay container
      let idGenerated = planNr + "Generated"
      // if the checkbox is checked: 
      if ($(this).prop("checked") == true) {
        // Initialize container for all region overlays so it can be emptied later
        $('#oldmap-container').append(`<div class="svg-container" id="${idGenerated}"></div>`)

        // get the region object array and loop over each regionObject to make one overlay each
        // Every city quarter has its own overlay which means they properties can be changed individually. Here they have different name tags, if needed they could have eg. different colors or line patterns.
        regionObjects.forEach(obj => {
          const nameString = obj.name;
          const pointsString = obj.points;
          const middle = obj.middle;
          const avgWealth = obj.avgWealth;

          // Define the colors in the wealth map based on average wealth of each region's citizens
          if (planNr === "choropleth") {
            if (obj.type === "Gonfaloni") {
              console.log(avgWealth)
              switch(true) {
                case avgWealth < 120:
                  var styleString = "fill:#f81010;opacity:0.6";
                  break; 
                case avgWealth <= 150:
                  var styleString = "fill:#ec5400;opacity:0.5";
                  break;
                case avgWealth <= 200:
                  var styleString = "fill:#d97900;opacity:0.5";
                  break;
                case avgWealth <= 230:
                  var styleString = "fill:#bf9700;opacity:0.5";
                  break;
                case avgWealth <= 260:
                  var styleString = "fill:#9fb000;opacity:0.5";
                  break;
                case avgWealth <= 300:
                  var styleString = "fill:#76c500;opacity:0.5";
                  break;
                case avgWealth > 300:
                  var styleString = "fill:#2bd83b;opacity:0.6";
                  break;
                default:
                  console.log("default")
              }

              // Append SVG overlay as its own container since HTML can't handle SVG containers themselves, since they use different namespaces.
              // The viewbox defines the SVG's size as the image size, preserveAspectRatio="none" means that the SVG overlay can be scaled and squished like the raster image instead of being cut off. 
              // Explanation for the use of SVGs: https://css-tricks.com/scale-svg/
              $(`#${idGenerated}`).append(`
            <div class="svg-container">
                <svg viewBox="0 0 2178 2121" preserveAspectRatio="none">
                  <polygon points="${pointsString}" style="${styleString}" />
                </svg>
              </div>
            `);
            } else {
              // do nothing, because we log the wealth of Gonfaloni, not of the Quartieri.
            };

          } else {
            // Condition if it is for plan2 or plan3
            // Define the style of the line.
            if (obj.type === "Quartieri") {
              var styleString = "fill:none;stroke:black;stroke-width:5"
              var textSize = "5em"
            } else {
              // Different line style for Gonfaloni: thinner, dashed line (stroke-dasharray)
              var styleString = "fill:none;stroke:black;stroke-dasharray:5,10;stroke-width:4"
              var textSize = "3em"
            }
            // Append SVG overlays for each region border
            $(`#${idGenerated}`).append(`
            <div class="svg-container">
                <svg viewBox="0 0 2178 2121" preserveAspectRatio="none">
                  <polygon points="${pointsString}" style="${styleString}" />
                  <text font-size="${textSize}" ${middle} fill="black">${nameString}</text>
                </svg>
              </div>
            `);
          }
        });
        // end for plan2 and plan3
      }

      // when the checkbox is unchecked again remove overlays
      else if ($(this).prop("checked") == false) {
        $(`#${idGenerated}`).empty();
      }
    });
  }


  // function to add icons to the map image based on coordinates in a JSON file. For checkbox use with jQuery: https://www.w3docs.com/snippets/javascript/how-to-test-if-a-checkbox-is-checked-with-jquery.html
  function mapIcons(planNr, jsonFilePath) {
    $('input[id="' + planNr + '"]').click(function () {
      // if the checkbox is checked: 
      if ($(this).prop("checked") == true) {
        // get data for icon position from JSON
        $.getJSON(jsonFilePath, function (data) {
          var selectedPlan = planNr;
          // Get the painters for the selected plan
          var painters = data[selectedPlan];
          // Iterate over each painter
          $.each(painters, function (painter, painterData) {
            // Access the painter's data
            var label = painterData.label;
            var iconTop = painterData.iconTop;
            var iconLeft = painterData.iconLeft;

            // create icon based on data
            var container = document.querySelector('#oldmap-container');
            // create the icon element
            var icon = document.createElement('i');
            icon.classList.add('fa', 'fa-circle', planNr + 'icon');
            icon.style.position = 'absolute';
            icon.style.width = '10px';
            icon.style.height = '10px';
            // append the icon element to the container element
            container.appendChild(icon);
            // place position as percentage
            icon.style.top = iconTop + '%';
            icon.style.left = iconLeft + '%';
          });
        });

        // when the checkbox is unchecked again:  
      } else if ($(this).prop("checked") == false) {
        $('.' + planNr + 'icon').remove();
      }
    });
  }

  // call the function for each checkbox 
  mapAnnotations("plan2", "assets/map-annotation-gonfaloni.json")
  mapAnnotations("choropleth", "assets/map-annotation-gonfaloni.json")
  mapIcons("plan6", "assets/examplejson.json");
  mapIcons("plan7", "assets/examplejson.json");


  // place text: https://www.w3schools.com/howto/howto_css_image_text.asp


  // Code for the Leaflat map of modern Florence. Edited version of: Agafonkin, Volodymyr. "Quick Start Guide - Leaflet - a JavaScript library for interactive maps". Accessed 22. April 2023. https://leafletjs.com/examples/quick-start/.
  var modernmap = L.map('modernmap').setView([43.7703, 11.2574], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(modernmap);



})


