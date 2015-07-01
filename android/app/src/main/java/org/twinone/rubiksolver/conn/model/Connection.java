package org.twinone.rubiksolver.conn.model;

/**
 * Created by twinone on 7/1/15.
 */
// Lowest layer of communication
public abstract class Connection {

    DataReceivedListener mListener;

    public interface DataReceivedListener {
        public void onDataReceived(byte[] data);
    }

    public abstract void sendData(byte[] data);

    public void setListener(DataReceivedListener listener) {
        mListener = listener;
    }
}
