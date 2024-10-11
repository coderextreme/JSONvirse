// https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
//
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    "use strict";

    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    "use strict";

    var start = polarToCartesian(x, y, radius, endAngle),
        end = polarToCartesian(x, y, radius, startAngle),

        largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1",

        d = [ "M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y ].join(" ");
    return d;
}

function plotSymbol(eightbits, rgb, bits) {
    "use strict";
    console.log("plot:", eightbits.toString(2), rgb, bits.toString(2));
    var left = 16,
        down = 16,
        svg = [],
        scale = 50,
    //     sx = (x+1) * scale,
    //     sy = (y+1) * scale,
        sx = scale,
        sy = scale;
    svg.push('<svg id="svg" width="200" height="90" xmlns="http://www.w3.org/2000/svg"><g id="g" style="font:10px times">');
    if (eightbits & 0x1) {
        svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx)+" "+(sy+down)+' Z"/>');
    }
    if (eightbits & 0x2) {
        svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, down, 270, 0)+'" stroke-width="2"/>');
    }
    if (eightbits & 0x4) {
        svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx-left)+" "+(sy)+' Z"/>');
    }
    if (eightbits & 0x8) {
        svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, left, 0, 90)+'" stroke-width="2"/>');
    }
    if (eightbits & 0x10) {
        svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx+left)+" "+(sy)+' Z"/>');
    }
    if (eightbits & 0x20) {
        svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, left, 90, 180)+'" stroke-width="2"/>');
    }
    if (eightbits & 0x40) {
        svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx)+" "+(sy-down)+' Z"/>');
    }
    if (eightbits & 0x80) {
        svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, down, 180, 270)+'" stroke-width="2"/>');
    }
    svg.push('<text x="'+(sx-scale/2)+'" y="'+(sy+scale/2)+'" fill="red" font="14px times">'+eightbits.toString(2).padStart(8,"0")+'</text>');
    svg.push('<text x="'+(sx-scale/2)+'" y="'+(sy+scale/2+10)+'" fill="green" font="14px times">'+eightbits+' '+bits.toString(2)+'</text>');
    svg.push("</g></svg>");
    let str = svg.join("\n");
    // console.error("stop here 2", str);
    return str;
}
