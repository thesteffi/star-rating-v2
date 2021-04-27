const dscc = require('@google/dscc');
const local = require('./localMessage.js');

// write viz code here
const drawViz = (data) => {

  const style = {
    height: dscc.getHeight(),
    width: dscc.getWidth(),
    padding: {
      top: Number.isFinite(data.style.top.value) != undefined ? data.style.top.value : 5,
      left: Number.isFinite(data.style.left.value) != undefined ? data.style.left.value : 5,
      right: Number.isFinite(data.style.right.value) != undefined ? data.style.right.value : 5,
      between : Number.isFinite(data.style.between.value) != undefined ? data.style.between.value : 5
    },
    text: {
      family: data.style.font.value != undefined ? data.style.font.value : data.theme.themeFontFamily,
      color: data.style.fontColor.value.color != undefined ? data.style.fontColor.value.color : data.theme.themeFontColor.color,
      hideMetricText: data.style.hideText.value != undefined ? data.style.hideText.value : data.style.hideText.defaultValue,
      hideDimText: data.style.hideDimension.value != undefined ? data.style.hideDimension.value : data.style.hideDimension.defaultValue,
      size: Number.isFinite(data.style.fontSize.value) ? data.style.fontSize.value : 12
    },
    icon: {
      borderWidth: Number.isFinite(data.style.iconBorderWidth.value) ? data.style.iconBorderWidth.value : 2,
      fillColor: data.style.iconFill.value.color != undefined ? data.style.iconFill.value.color : data.theme.themeSeriesColor[0].color,
      borderColor: data.style.iconBorderColor.value.color != undefined ? data.style.iconBorderColor.value.color : data.theme.themeSeriesColor[0].color,
      height: Number.isFinite(data.style.starHeight.value) ? data.style.starHeight.value : 12,
      empty: data.style.emptyFill.value.color != undefined ? data.style.emptyFill.value.color : data.style.emptyFill.themeFillColor.value,
      chubbyness: Number.isFinite(data.style.chubbyness.value) ? data.style.chubbyness.value : 9
    },
    numStars: Number.isFinite(data.style.numStars.value) != undefined ? data.style.numStars.value : 5
  }
  
  const tableData = data.tables.DEFAULT;

  /* Parts of this code adapted from @Amanda Schroeder (https://github.com/amandaschroeder/experimental-visualizations/) - thanks for your Work! */
  /* SVG Star Algorithm from JonathanDn (https://github.com/JonathanDn/vue-stars-rating/blob/master/star-rating.vue) - thanks for your work, too! */
  
  let outer = document.createElement("div");
  outer.id = "star-vis-outer";
  if(document.getElementById('star-vis-outer')){
    document.getElementById('star-vis-outer').replaceWith(outer);
  }else{
    document.body.appendChild(outer);
  }

  const showError = (message) => {
    outer.innerText = message;
    outer.style.cssText = "background-color: red; color: white";
  }

  //check if has data
  if (tableData.length < 1 || typeof tableData[0].starMetric === 'undefined') {
    let message = `Visualization failed. No metric provided. There must be one metric within the range of 0 to ${style.numStars}.`;
    showError(message);
    return; 
  }

  // check if Metric is in bounds set by user
  

  tableData.forEach((tdata, index) => {
    
    let metric = Number.parseFloat(tdata.starMetric[0]).toFixed(2);
    let dimension = "(none)";
    if(tdata.starDimension){
      dimension = tdata.starDimension[0];
    }

    if (metric < 0 || metric > style.numStars) {
      let message = `Visualization failed. The metric provided must be within the range of 0 to ${style.numStars}.`;
      showError(message);
      return;
    }

    var row = document.createElement("div");
    row.classList.add("row");
    row.id = `row${index}`;
    row.style.cssText = `margin-top:${style.padding.top}px; margin-left:${style.padding.left}px; margin-right:${style.padding.right}px;`;
    row.innerHTML = `
      <div class="dimension ${style.text.hideDimText ? "hide" : "show"}" id="dimension${index}" style="margin-right:${style.padding.between}px; font-size:${style.text.size}px; font-family: ${style.text.family}; color: ${style.text.color}">
        ${dimension}:
      </div>
      <div class="metric ${style.text.hideMetricText ? "hide" : "show"}" id="metric${index}" style="margin-right:${style.padding.between}px; font-size:${style.text.size}px; font-family: ${style.text.family}; color: ${style.text.color}">
        ${metric}
      </div>
      <div id="starPlaceholder${index}" class="starPlaceholder" height="${style.icon.height}px" style="margin-right:${style.padding.right}px;"></div>
    `;
    document.getElementById('star-vis-outer').appendChild(row);
    let svgContainer = document.getElementById(`starPlaceholder${index}`);

    // calculate stars
    let h = 50;
    let centerX = h / 2;
    let centerY = h / 2;
    let numPoints = 5;
    let outerRadius = (h / 2) - style.icon.borderWidth;
    let innerOuterRadiusRatio = Math.max(style.icon.chubbyness, 4) / 4; // make sure values don't drop below 0
    let innerRadius = outerRadius / innerOuterRadiusRatio;

    let points = ((centerX, centerY, numPoints, innerRadius, outerRadius) => {
      let angle = Math.PI / numPoints;
      let angleOffsetToCenterStar = 60;
      let totalArms = numPoints * 2;
      let points = "";
      for (let i = 0; i < totalArms; i++) {
        let isEvenIndex = i % 2 == 0;
        let r = isEvenIndex ? outerRadius : innerRadius;
        let currX = centerX + Math.cos(i * angle + angleOffsetToCenterStar) * r;
        let currY = centerY + Math.sin(i * angle + angleOffsetToCenterStar) * r;
        points += currX + "," + currY + " ";
      }
      return points;
    })(centerX, centerY, numPoints, innerRadius, outerRadius);

    // Returns metric without possible decimal
    const fullStars = parseInt(metric);
    /**
      Determine whether or not a partially-filled star is needed#
    **/

    let rest = metric % 1;
    let percentage = undefined;
    if(rest > 0){
      percentage = Math.round(rest * 100);
    }

    for(let i = 0; i < style.numStars; i++){
      let svgElem = document.createElementNS("http://www.w3.org/2000/svg","svg");
      svgElem.setAttributeNS(null,"viewBox","0 0 50 50");
      svgElem.setAttributeNS(null,"height",`${style.icon.height}px`);
      svgElem.setAttributeNS(null,"preserveAspectRatio","xMidYMid meet");
      svgElem.setAttributeNS(null,"class","star");

      let color = style.icon.empty;
      if(i < fullStars){
        color = style.icon.fillColor;
      }
      if(percentage && i == fullStars){
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        let linGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linGrad.setAttributeNS(null,"id",`gradient${index}`);
        linGrad.setAttributeNS(null,"x1","0%");
        linGrad.setAttributeNS(null,"y1","0%");
        linGrad.setAttributeNS(null,"x2","100%");
        linGrad.setAttributeNS(null,"y2","0%");
        let stops = [
          {
            style : `stop-color: ${style.icon.fillColor}; stop-opacity: 1`,
            dynStop : `${percentage}%`
          },{
            style : `stop-color: ${style.icon.empty}; stop-opacity: 1`,
            dynStop : `0%`
          }];
        stops.forEach(stop => {
          let s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          s.setAttributeNS(null,"offset",stop.dynStop);
          s.setAttributeNS(null,"style",stop.style);
          linGrad.appendChild(s);
        });
        defs.appendChild(linGrad);
        svgElem.appendChild(defs);

        color = `url(#gradient${index})`;

      }

      let s =  document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      s.id = `star_${index}-${i}`;
      s.setAttributeNS(null,'points',points);
      s.setAttributeNS(null,'fill',color);
      s.setAttributeNS(null,"stroke",style.icon.borderColor);
      s.setAttributeNS(null,"stroke-width",style.icon.borderWidth);
      svgElem.appendChild(s);
      svgContainer.appendChild(svgElem);
    }
  });
}

// renders locally
const DSCC_IS_LOCAL = false;
if (DSCC_IS_LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}



/* STAR VIZ JSFIDDLE

https://jsfiddle.net/28acuvx6/123/

*/