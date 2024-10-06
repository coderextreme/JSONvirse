// https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
//
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	  return {
		      x: centerX + (radius * Math.cos(angleInRadians)),
		      y: centerY + (radius * Math.sin(angleInRadians))
		    };
}

function describeArc(x, y, radius, startAngle, endAngle){

	    var start = polarToCartesian(x, y, radius, endAngle);
	    var end = polarToCartesian(x, y, radius, startAngle);

	    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	    var d = [
		            "M", start.x, start.y, 
		            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
		        ].join(" ");

	    return d;       
}

function plotSymbol(x, y, rgb) {
	let left = 16;
	let down = 16;
	let svg = [];
	let scale = 50;
	// let sx = (x+1) * scale;
	// let sy = (y+1) * scale;
	let sx = scale;
	let sy = scale;
	svg.push('<svg id="svg" width="82" height="82" xmlns="http://www.w3.org/2000/svg"><g id="g" style="font:10px times">')
	if (x & 0x1) {
		svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx)+" "+(sy-down)+' Z"/>');
	}
	if (x & 0x2) {
		svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, left, 0, 90)+'" stroke-width="2"/>');
	}
	if (x & 0x4) {
		svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx+left)+" "+(sy)+' Z"/>');
	}
	if (y & 0x8) {
		svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, down, 270, 0)+'" stroke-width="2"/>');
	}
	if (y & 0x1) {
		svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx)+" "+(sy+down)+' Z"/>');
	}
	if (y & 0x2) {
		svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, left, 180, 270)+'" stroke-width="2"/>');
	}
	if (y & 0x4) {
		svg.push('<path stroke="'+rgb+'" stroke-width="2" d="M'+(sx)+" "+(sy)+ " L"+(sx-left)+" "+(sy)+' Z"/>');
	}
	if (x & 0x8) {
		svg.push('<path fill="transparent" stroke="'+rgb+'" d="'+describeArc(sx, sy, down, 90, 180)+'" stroke-width="2"/>');
	}
	svg.push('<text x="'+(sx-scale/2)+'" y="'+(sy+scale/2)+'" fill="red" font="14px times">'+(((y & 0xF) << 4) | x).toString(2).padStart(8,"0")+'</text>');
	svg.push('<text x="'+(sx-scale/2)+'" y="'+(sy+scale/2+10)+'" fill="green" font="14px times">'+(((y & 0xF) << 4) | x)+'</text>');
	svg.push("</g></svg>");
	let str = svg.join("\n");
	// console.error("stop here 2", str);
	return str;
}
