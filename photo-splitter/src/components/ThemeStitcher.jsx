import React, { useState, useRef } from 'react';
import ImageCropper from './ImageCropper';
import { stitchImages } from './ImageStitcher';

export default function ThemeStitcher() {
  const [lightImage, setLightImage] = useState(null);
  const [darkImage, setDarkImage] = useState(null);
  const [croppedLight, setCroppedLight] = useState(null);
  const [croppedDark, setCroppedDark] = useState(null);
  const [step, setStep] = useState(1);
  const [splitDirection, setSplitDirection] = useState('vertical');
  const [stitchedImage, setStitchedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const lightCropperRef = useRef(null);
  const darkCropperRef = useRef(null);

  const handleLightImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setLightImage(reader.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setDarkImage(reader.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const syncCroppers = () => {
    if (lightCropperRef.current && darkCropperRef.current) {
      const lightCropData = lightCropperRef.current.getCropData();
      darkCropperRef.current.setCropData(lightCropData);
    }
  };

  const handleCrop = async () => {
    if (lightCropperRef.current && darkCropperRef.current) {
      setIsProcessing(true);
      setError(null);
      try {
        const croppedLightImg = await lightCropperRef.current.crop();
        setCroppedLight(croppedLightImg);

        const croppedDarkImg = await darkCropperRef.current.crop();
        setCroppedDark(croppedDarkImg);
        setStep(3);
      } catch (err) {
        setError('Failed to crop images. Please try again.');
        console.error('Cropping error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStitch = async () => {
    if (croppedLight && croppedDark) {
      setIsProcessing(true);
      setError(null);
      try {
        const stitchedImg = await stitchImages(croppedLight, croppedDark, splitDirection);
        setStitchedImage(stitchedImg);
        setStep(4);
      } catch (err) {
        setError('Failed to stitch images. Please try again.');
        console.error('Stitching error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const downloadImage = () => {
    if (stitchedImage) {
      const link = document.createElement('a');
      link.download = 'theme-stitched.png';
      link.href = stitchedImage;
      link.click();
    }
  };

  const resetTool = () => {
    setLightImage(null);
    setDarkImage(null);
    setCroppedLight(null);
    setCroppedDark(null);
    setStitchedImage(null);
    setStep(1);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {/* Step 1: Upload images */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 1: Upload Theme Screenshots</h2>
          <p className="text-gray-600 dark:text-gray-300">
            For best results, use a screenshot tool with a fixed region to capture both themes at the same position.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h3 className="font-medium mb-2">Light Theme</h3>
              {lightImage ? (
                <div>
                  <img
                    src={lightImage}
                    alt="Light theme preview"
                    className="max-h-64 mx-auto mb-2 w-1/2 object-contain"
                  />
                  <button onClick={() => setLightImage(null)} className="text-red-500 text-sm">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Select Light Theme Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLightImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h3 className="font-medium mb-2">Dark Theme</h3>
              {darkImage ? (
                <div>
                  <img
                    src={darkImage}
                    alt="Dark theme preview"
                    className="max-h-64 mx-auto mb-2 w-1/2 object-contain"
                  />
                  <button onClick={() => setDarkImage(null)} className="text-red-500 text-sm">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Select Dark Theme Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDarkImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep(2)}
              disabled={!lightImage || !darkImage}
              className={`px-6 py-2 rounded-lg ${
                !lightImage || !darkImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next: Crop Images
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Crop images */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 2: Crop Images Identically</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Adjust the crop area on the light image. The same crop will be applied to the dark image.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Light Theme</h3>
              <ImageCropper image={lightImage} ref={lightCropperRef} onCropChange={syncCroppers} />
            </div>

            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Dark Theme</h3>
              <ImageCropper image={darkImage} ref={darkCropperRef} isFollower={true} />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isProcessing ? 'Cropping...' : 'Crop Both Images'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Stitch setup */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 3: Stitch Images</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Light Theme (Cropped)</h3>
              <img
                src={croppedLight}
                alt="Cropped light theme"
                className="border border-gray-300 rounded-lg w-full object-contain"
              />
            </div>

            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Dark Theme (Cropped)</h3>
              <img
                src={croppedDark}
                alt="Cropped dark theme"
                className="border border-gray-300 rounded-lg w-full object-contain"
              />
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Split Direction</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="vertical"
                  checked={splitDirection === 'vertical'}
                  onChange={() => setSplitDirection('vertical')}
                  className="mr-2"
                />
                Vertical (Left/Right)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="horizontal"
                  checked={splitDirection === 'horizontal'}
                  onChange={() => setSplitDirection('horizontal')}
                  className="mr-2"
                />
                Horizontal (Top/Bottom)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="diagonal1"
                  checked={splitDirection === 'diagonal1'}
                  onChange={() => setSplitDirection('diagonal1')}
                  className="mr-2"
                />
                Diagonal (Top-Left to Bottom-Right)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="diagonal2"
                  checked={splitDirection === 'diagonal2'}
                  onChange={() => setSplitDirection('diagonal2')}
                  className="mr-2"
                />
                Diagonal (Bottom-Left to Top-Right)
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handleStitch}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isProcessing ? 'Stitching...' : 'Stitch Images'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 4: Download Result</h2>

          <div className="text-center">
            <h3 className="font-medium mb-2">Stitched Image</h3>
            <img
              src={stitchedImage}
              alt="Stitched theme image"
              className="max-w-1/2 border border-gray-300 rounded-lg mx-auto object-contain"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Back
            </button>
            <div className="space-x-4">
              <button
                onClick={downloadImage}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Download Image
              </button>
              <button
                onClick={resetTool}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}