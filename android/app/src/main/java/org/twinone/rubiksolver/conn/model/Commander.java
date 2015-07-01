package org.twinone.rubiksolver.conn.model;

/**
 * Created by twinone on 7/1/15.
 */
// Class responsible of sending commands through a Connection
public class Commander implements Connection.DataReceivedListener {

    private Connection mConnection;

    private ResultListener mResultListener;

    public interface ResultListener {
        void onResult(Message message);
    }

    public Commander(Connection c, ResultListener listener) {
        mConnection = c;
        mConnection.setListener(this);
        mResultListener = listener;
    }
    public void sendCommand(Command command) {
        mConnection.sendData(command.serialize());
    }

    @Override
    public void onDataReceived(byte[] data) {
        mResultListener.onResult(Message.deserialize(data));
    }
}
