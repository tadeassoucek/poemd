const input = document.getElementById("input-code");
const outputLog = document.getElementById("output-log");

poemd.log.write = function (data, prefix) {
  prefix = poemd.log.prefixes[prefix] || prefix;
  if (typeof prefix === "object" && prefix && "value" in prefix) prefix = prefix.value;

  let table = outputLog.childNodes[outputLog.childNodes.length - 1];
  if (!(table instanceof HTMLTableElement) || table.classList.contains("generated")) {
    table = document.createElement("table");
    outputLog.appendChild(table);
  }

  let row = document.createElement("tr");
  table.appendChild(row);
  let prefixEl = document.createElement("th");
  prefixEl.innerHTML = prefix;
  row.appendChild(prefixEl);
  let dataEl = document.createElement("td");
  dataEl.innerHTML = Array.isArray(data) ? data.join(" ") : data;
  row.appendChild(dataEl);
};

poemd.log.writeTable = function (rows, headers) {
  let tableHTML = '<table class="generated">';
  if (headers)
    tableHTML +=
      "<tr>" +
      headers
        .map(function (h) {
          return "<th>" + h + "</th>";
        })
        .join("") +
      "</tr>";

  tableHTML += rows
    .map(function (row) {
      return (
        "<tr>" +
        row
          .map(function (cell) {
            return "<td>" + cell + "</td>";
          })
          .join("") +
        "</tr>"
      );
    })
    .join("");

  poemd.log.write(tableHTML + "</table>", "TABLE");
};

Object.keys(poemd.log.prefixes).forEach(function (k) {
  poemd.log.prefixes[k] = {
    value: `<span class="poemd-log-prefix-${k}">${k.toUpperCase()}</span>`,
    length: k.length
  };
});

input.onkeyup = function (ev) {
  if (ev.ctrlKey && ev.code === "Enter") parse();
};

const buttonParse = document.getElementById("button-parse");
const inputParserSequences = document.getElementById("input-parser-sequences");

function parse() {
  poemd.State.resetID();
  outputLog.innerHTML = "";
  const sequences = inputParserSequences.value.split(",").map(function (s) {
    return s.trim();
  });
  const parser = new poemd.Parser(sequences);
  parser.parse(input.value);
}

buttonParse.onclick = parse;
buttonParse.click();

function makeDraggable(element, direction) {
  var mouseDownInfo;
  const left = element.parentNode.getElementsByClassName("left")[0];
  const right = element.parentNode.getElementsByClassName("right")[0];

  element.onmousedown = onMouseDown;

  function onMouseDown(e) {
    //console.log("mouse down: " + e.clientX);
    mouseDownInfo = {
      e,
      offsetLeft: element.offsetLeft,
      offsetTop: element.offsetTop,
      leftWidth: left.offsetWidth,
      rightWidth: right.offsetWidth
    };

    document.onmousemove = onMouseMove;
    document.onmouseup = function () {
      document.onmousemove = document.onmouseup = null;
    };
  }

  function onMouseMove(e) {
    var delta = { x: e.clientX - mouseDownInfo.e.clientX, y: e.clientY - mouseDownInfo.e.clientY };

    if (direction === "V") {
      delta.x = Math.min(Math.max(delta.x, -mouseDownInfo.leftWidth), mouseDownInfo.rightWidth);

      element.style.left = mouseDownInfo.offsetLeft + delta.x + "px";
      left.style.width = mouseDownInfo.leftWidth + delta.x + "px";
      right.style.width = mouseDownInfo.rightWidth - delta.x + "px";
    } else throw new Error("unknown direction: '" + direction + "'");
  }
}

document.querySelectorAll(".split-v > .separator").forEach(function (el) {
  makeDraggable(el, "V");
});
