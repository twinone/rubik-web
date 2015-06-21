package org.twinone.rubiksolver;

import android.app.Activity;
import android.app.Fragment;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.hardware.Camera;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;
import android.widget.Toast;

/**
 * Created by twinone on 6/20/15.
 */
@SuppressWarnings("deprecation")
public class CameraFragment extends Fragment implements View.OnClickListener, Camera.PictureCallback {

    private static final String TAG = "CameraFragment";

    // We take square images
    private static final int IMAGE_SIZE = 100;

    private CameraPreview mCameraPreview;
    private Button mButtonCapture;
    private FrameLayout mFrameLayout;
    private Camera mCamera;
    private int mCameraId;
    private int mCameraRotation;
    private HighlightView mHLView;
    private RelativeLayout mRelativeLayout;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {


        mRelativeLayout = (RelativeLayout) inflater.inflate(R.layout.fragment_camera, null);
        mButtonCapture = (Button) mRelativeLayout.findViewById(R.id.button_capture);
        mButtonCapture.setOnClickListener(this);

        mFrameLayout = (FrameLayout) mRelativeLayout.findViewById(R.id.frame_layout);
        return mRelativeLayout;
    }

    public static Camera getCameraInstance(int id) {
        Camera c = null;
        try {
            c = Camera.open(id);
        } catch (Exception e) {
            Log.d(TAG, "Camera not available");
        }
        return c;
    }

    private int getCameraId() {
        int n = Camera.getNumberOfCameras();
        for (int i = 0; i < n; i++) {
            Camera.CameraInfo info = new Camera.CameraInfo();
            Camera.getCameraInfo(i, info);
            if (info.facing == Camera.CameraInfo.CAMERA_FACING_BACK) {
                return i;
            }
        }
        return -1;
    }

    @Override
    public void onStart() {
        super.onStart();

        mCameraId = getCameraId();
        if (mCameraId == -1) {
            Toast.makeText(getActivity(), "Camera not available", Toast.LENGTH_SHORT).show();
            return;
        }
        mCamera = getCameraInstance(mCameraId);
        mCameraPreview = new CameraPreview(getActivity(), mCamera);

        mCameraRotation = getCameraRotation(getActivity(), mCameraId, mCamera);
        mCamera.setDisplayOrientation(mCameraRotation);

        mFrameLayout.removeAllViews();
        mFrameLayout.addView(mCameraPreview);

        if (mHLView != null && mHLView.getParent() == mRelativeLayout) mRelativeLayout.removeView(mHLView);
        mHLView = new HighlightView(getActivity());
        mRelativeLayout.addView(mHLView);
    }

    @Override
    public void onStop() {
        super.onStop();

        mCamera.release();
    }

    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.button_capture) {
            capture();
        }
    }

    void capture() {
        Log.d(TAG, "Capturing...");
        Camera.Parameters p = mCamera.getParameters();

        p.setPictureFormat(ImageFormat.JPEG);
        int min = Integer.MAX_VALUE;
        int w = 0;
        int h = 0;
        for (Camera.Size s : p.getSupportedPictureSizes()) {
            Log.d(TAG, "Supported resolution:" + s.width + "x" + s.height);
            int val = s.width * s.height;
            if (val < min) {
                min = val;
                w = s.width;
                h = s.height;
            }
        }
        Log.d(TAG, "Setting camera resolution:" + w + "x" + h);
        p.setPictureSize(w, h);

        mCamera.setParameters(p);
        mCamera.takePicture(null, null, this);
    }

    @Override
    public void onPictureTaken(byte[] data, Camera camera) {
        Log.d(TAG, "Picture taken!!");

        Bitmap b = rotateBitmap(BitmapFactory.decodeByteArray(data, 0, data.length), mCameraRotation);
        int w = b.getWidth();
        int h = b.getHeight();
        Log.d(TAG, "Image dimensions: " + w + "x" + h);

        int sw = mCameraPreview.getWidth();
        int sh = mCameraPreview.getHeight();
        Log.d(TAG, "Preview dimensions: " + sw + "x" + sh);

        mButtonCapture.setTextColor(b.getPixel(w / 2, h / 2));
        mButtonCapture.setBackground(new BitmapDrawable(b));
    }

    double map(double a, double from, double to) {
        return a / from * to;
    }

    public static Bitmap rotateBitmap(Bitmap source, float angle) {
        Matrix matrix = new Matrix();
        matrix.postRotate(angle);
        return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
    }

    public static int getCameraRotation(Activity activity, int cameraId, android.hardware.Camera camera) {
        android.hardware.Camera.CameraInfo info =
                new android.hardware.Camera.CameraInfo();
        android.hardware.Camera.getCameraInfo(cameraId, info);
        int rotation = activity.getWindowManager().getDefaultDisplay()
                .getRotation();
        int degrees = 0;
        switch (rotation) {
            case Surface.ROTATION_0:
                degrees = 0;
                break;
            case Surface.ROTATION_90:
                degrees = 90;
                break;
            case Surface.ROTATION_180:
                degrees = 180;
                break;
            case Surface.ROTATION_270:
                degrees = 270;
                break;
        }

        int result;
        if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
            result = (info.orientation + degrees) % 360;
            result = (360 - result) % 360;  // compensate the mirror
        } else {  // back-facing
            result = (info.orientation - degrees + 360) % 360;
        }

        return result;
    }

    double[] average(Bitmap bm) {
        int w = bm.getWidth();
        int h = bm.getHeight();
        int s = w * h;
        double r = 0;
        double g = 0;
        double b = 0;
        int[] pixels = new int[s];
        bm.getPixels(pixels, 0, w, 0, 0, w, h);
        for (int i = 0; i < h; i++) {
            for (int j = 0; j < w; j++) {
                int c = pixels[i * w + j];
                int pr = Color.red(c);
                int pg = Color.green(c);
                int pb = Color.blue(c);
                r += pr * pr;
                g += pg * pg;
                b += pb * pb;
            }
        }
        r = Math.sqrt(r / (double) s);
        g = Math.sqrt(g / (double) s);
        b = Math.sqrt(b / (double) s);
        return new double[]{r, g, b};
    }
}
