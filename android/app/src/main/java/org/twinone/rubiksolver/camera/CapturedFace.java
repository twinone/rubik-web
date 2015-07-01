package org.twinone.rubiksolver.camera;

import android.graphics.Color;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created by twinone on 6/20/15.
 */
public class CapturedFace {

    public static final byte F = 1, B = -F;
    public static final byte U = 2, D = -U;
    public static final byte R = 3, L = -R;
    public static final List<Byte> FACE_LIST = Arrays.asList(new Byte[]{F, R, B, L, U, D});

    public final int size;
    // Colors of this CapturedFace
    public final double[][][] m;

    public CapturedFace(int size) {
        this.size = size;
        this.m = new double[size][size][3];
    }

    public int getColor(int i, int j) {
        double[] c = m[i][j];
        return Color.rgb((int) c[0], (int) c[1], (int) c[2]);
    }

}
