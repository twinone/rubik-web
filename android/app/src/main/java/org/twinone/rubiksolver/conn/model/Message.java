package org.twinone.rubiksolver.conn.model;

import java.util.Arrays;
import java.util.List;

/**
 * Created by twinone on 7/1/15.<br/>
 * A message can be sent from both sides and is always at least 16 bits, and normally no longer.<br/>
 * We call these bits/bytes the "control bits/bytes" (cb)<br/><br/>
 *
 *
 * <b>b15 (EXT)</b>: If 1, the message contains an extension: after the control bytes there is another
 * byte (unsigned int) N. A N-length standard C string follows (terminated by a null byte)<br/>
 * In this case, the total length of the message is 2(cb)+1(N)+N+1(null) = N+4 bytes<br/>
 * <br/>
 *
 * <b>b14 (CMD): if 1, this is a command message</b>, <b>b0..13</b> behave as follows:<br/>
 *
 * <b>b0..1 (ANG)</b>: Angle<br/>
 * <b>b2 (SNG)</b>: Sign:
 * 0 is clockwise, 1 is CCW. This is useful when the client sends it's available to
 * us, for example we now know the client is going to do F3 instead of F'
 * if it doesn't support CCW moves<br/>
 * <b>b3..6 (FC)</b>: The face to be used as a reference for rotation of the layer(s)/cube<br/>
 * <b>b7..10 (NL)</b> An unsigned int representing the <b>N</b>umber of <b>L</b>ayers we turn.
 * <b>0</b> indicates to turn the <b>whole cube</b> (all Layers)<br/>
 * If the message comes from the client, it indicates the number of layers it can turn.
 * To be able to solve any NxNxN cube, the client MUST be able to turn at least floor(N/2) layers
 * <br/>
 * <b>b11..12</b> <b>Unused</b> (They say that if these bits are set to the correct combination,
 * the NSA won't spy on you).<br/>

 * <br/><br/>
 *
 * If <b>CMD=0</b>, b11.13 are unused, and <b>b0..11</b> mean:<br/>
 *  <b>Server Messages</b><br/>
 * 0x000: Cube size (the message extension is a string containing the cube size)<br/>
 * 0x001: Setup Start (The setup is about to begin)<br/>
 * 0x002: Cleanup (Client should remove any arms around the cube so the we can take a
 *          clear picture of it)<br/>
 * 0x003: Setup End / Solving Start<br/>
 * <br/>
 * <b>Client Messages</b><br/>
 * 0x100: OK
 * 0x101: BC    
 * 0x102: KO
 * 0x100: El caloret del verano (Too hot to operate)
 *
 * <b>Messages from both client and server</b><br/>
 * 0x200: Text (If the other side can display text, it MAY display this text)
 *
 * <br/><br/>
 * TODO:
 * Some bits can be used to indicate a request instead of a command. For example, the client has to
 * send us the available commands for that specific client, so we could have a bit for that request.
 */
public class Message {

    public static final byte ROT_0 = 0;
    public static final byte ROT_90 = 1;
    public static final byte ROT_180 = 2;
    public static final byte ROT_270 = 3;

    public static final byte FACE_F = 0, FACE_B = 1;
    public static final byte FACE_U = 2, FACE_D = 3;
    public static final byte FACE_R = 4, FACE_L = 5;

    public static int getOpposed(int face) {
        return (face + (face % 2 == 0 ? 1 : -1) % 6);
    }

    public static final List<Byte> FACE_LIST = Arrays.asList(new Byte[]{
            FACE_F, FACE_R, FACE_B, FACE_L, FACE_U, FACE_D
    });

    private int mAngle;
    private int mFace;
    private int mNumLayers;

    public int getAngle() {
        return mAngle;
    }

    public int getFace() {
        return mFace;
    }

    public int getNumLayers() {
        return mNumLayers;
    }

    public void setAngle(int angle) {
        mAngle = angle;
    }

    public void setFace(int face) {
        mFace = face;
    }

    public void setNumLayers(int numLayers) {
        mNumLayers = numLayers;
    }

    // TODO
    public byte[] serialize() {
        throw new RuntimeException("Not implemented yet");
    }

    // TODO
    public static Command deserialize(byte[] serialized) {
        throw new RuntimeException("Not implemented yet");
    }
}
