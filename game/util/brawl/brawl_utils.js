//http://www.codeguru.com/forum/showthread.php?t=194400
function distanceFromLineSegment(to_point, point_1, point_2) {
	var cx = to_point.x
		, cy = to_point.y
		, ax = point_1.x
		, ay = point_1.y
		, bx = point_2.x
		, by = point_2.y;

	//
	// find the distance from the point (cx,cy) to the line
	// determined by the points (ax,ay) and (bx,by)
	//
	// distanceSegment = distance from the point to the line segment
	// distanceLine = distance from the point to the line (assuming
	//					infinite extent in both directions
	//

/*

Subject 1.02: How do I find the distance from a point to a line?


    Let the point be C (Cx,Cy) and the line be AB (Ax,Ay) to (Bx,By).
    Let P be the point of perpendicular projection of C on AB.  The parameter
    r, which indicates P's position along AB, is computed by the dot product 
    of AC and AB divided by the square of the length of AB:
    
    (1)     AC dot AB
        r = ---------  
            ||AB||^2
    
    r has the following meaning:
    
        r=0      P = A
        r=1      P = B
        r<0      P is on the backward extension of AB
        r>1      P is on the forward extension of AB
        0<r<1    P is interior to AB
    
    The length of a line segment in d dimensions, AB is computed by:
    
        L = sqrt( (Bx-Ax)^2 + (By-Ay)^2 + ... + (Bd-Ad)^2)

    so in 2D:   
    
        L = sqrt( (Bx-Ax)^2 + (By-Ay)^2 )
    
    and the dot product of two vectors in d dimensions, U dot V is computed:
    
        D = (Ux * Vx) + (Uy * Vy) + ... + (Ud * Vd)
    
    so in 2D:   
    
        D = (Ux * Vx) + (Uy * Vy) 
    
    So (1) expands to:
    
            (Cx-Ax)(Bx-Ax) + (Cy-Ay)(By-Ay)
        r = -------------------------------
                          L^2

    The point P can then be found:

        Px = Ax + r(Bx-Ax)
        Py = Ay + r(By-Ay)

    And the distance from A to P = r*L.

    Use another parameter s to indicate the location along PC, with the 
    following meaning:
           s<0      C is left of AB
           s>0      C is right of AB
           s=0      C is on AB

    Compute s as follows:

            (Ay-Cy)(Bx-Ax)-(Ax-Cx)(By-Ay)
        s = -----------------------------
                        L^2


    Then the distance from C to P = |s|*L.

*/


	var r_numerator = (cx-ax)*(bx-ax) + (cy-ay)*(by-ay);
	var r_denomenator = (bx-ax)*(bx-ax) + (by-ay)*(by-ay);
	var r = r_numerator / r_denomenator;
//
    var px = ax + r*(bx-ax);
    var py = ay + r*(by-ay);
//     
    var s =  ((ay-cy)*(bx-ax)-(ax-cx)*(by-ay) ) / r_denomenator;

	var distanceLine = Math.abs(s)*Math.sqrt(r_denomenator);
	var distanceSegment;

//
// (xx,yy) is the point on the lineSegment closest to (cx,cy)
//
	var xx = px;
	var yy = py;

	if ((r >= 0) && (r <= 1)) {
		distanceSegment = distanceLine;
	}
	else {
		var dist1 = (cx-ax)*(cx-ax) + (cy-ay)*(cy-ay);
		var dist2 = (cx-bx)*(cx-bx) + (cy-by)*(cy-by);
		if (dist1 < dist2) {
			xx = ax;
			yy = ay;
			distanceSegment = Math.sqrt(dist1);
		}
		else {
			xx = bx;
			yy = by;
			distanceSegment = Math.sqrt(dist2);
		}
	}

	return {line: distanceLine, segment: distanceSegment};
}

try {
	if(typeof exports !== undefined) {
		exports.distanceFromLineSegment = distanceFromLineSegment;
	}
}
catch(e) {}
