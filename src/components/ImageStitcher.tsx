import { useState, useRef, type ChangeEvent, type JSX } from 'react';
import ImageCropper, { type ImageCropperRef } from './ImageCropper';
import { stitchImages, type StitchDirection } from './StitchingUtilities.ts';

export default function ThemeStitcher(): JSX.Element {
  const [lightImage, setLightImage] = useState<string | null>(null);
  const [darkImage, setDarkImage] = useState<string | null>(null);
  const [croppedLight, setCroppedLight] = useState<string | null>(null);
  const [croppedDark, setCroppedDark] = useState<string | null>(null);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [splitDirection, setSplitDirection] = useState<StitchDirection>('vertical');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lightCropperRef = useRef<ImageCropperRef | null>(null);
  const darkCropperRef = useRef<ImageCropperRef | null>(null);

  const handleLightImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setLightImage(event.target.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setDarkImage(event.target.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const syncCroppers = (): void => {
    if (lightCropperRef.current && darkCropperRef.current) {
      const lightCropData = lightCropperRef.current.getCropData();
      darkCropperRef.current.setCropData(lightCropData);
    }
  };

  const handleCrop = async (): Promise<void> => {
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

  const handleStitch = async (): Promise<void> => {
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

  const downloadImage = (): void => {
    if (stitchedImage) {
      const link = document.createElement('a');
      link.download = 'theme-stitched.png';
      link.href = stitchedImage;
      link.click();
    }
  };

  const resetTool = (): void => {
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
      <div className="flex items-center justify-between mb-8 relative">
        <div 
          className={`absolute h-0.5 left-0 w-1/3 top-1/2 transform -translate-y-1/2 z-0 ${
            step >= 2 ? 'bg-[#11b1b4] dark:bg-[#2bbdc0]' : 'bg-gray-200'
          }`}
        ></div>
        <div 
          className={`absolute h-0.5 left-1/3 w-1/3 top-1/2 transform -translate-y-1/2 z-0 ${
            step >= 3 ? 'bg-[#11b1b4] dark:bg-[#2bbdc0]' : 'bg-gray-200'
          }`}
        ></div>
        <div 
          className={`absolute h-0.5 left-2/3 w-1/3 top-1/2 transform -translate-y-1/2 z-0 ${
            step >= 4 ? 'bg-[#11b1b4] dark:bg-[#2bbdc0]' : 'bg-gray-200'
          }`}
        ></div>
        
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
              step >= s ? 'bg-[#11b1b4] dark:bg-[#2bbdc0] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 1: Upload Theme Screenshots</h2>
          <p className="text-gray-600 dark:text-gray-300">
            For best results, use a screenshot tool with a fixed region to capture both themes at the same position.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h3 className="font-medium mb-2">Image one</h3>
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
                  <label className="cursor-pointer inline-block bg-[#11b1b4] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white px-4 py-2 rounded-md">
                    Select Image
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
              <h3 className="font-medium mb-2">Image two</h3>
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
                  <label className="cursor-pointer inline-block bg-[#11b1b4] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white px-4 py-2 rounded-md">
                    Select Image
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
                  : 'bg-[#11b1b4] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white'
              }`}
            >
              Next: Crop Images
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 2: Crop Images Identically</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Adjust the crop area on the light image. The same crop will be applied to the dark image.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Light Theme</h3>
              {lightImage && (
                <ImageCropper image={lightImage} ref={lightCropperRef} onCropChange={syncCroppers} />
              )}
            </div>

            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Dark Theme</h3>
              {darkImage && (
                <ImageCropper image={darkImage} ref={darkCropperRef} isFollower={true} />
              )}
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
                  : 'bg-[#11b1b4] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white'
              }`}
            >
              {isProcessing ? 'Cropping...' : 'Crop Both Images'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 3: Stitch Images</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Light Theme (Cropped)</h3>
              {croppedLight && (
                <img
                  src={croppedLight}
                  alt="Cropped light theme"
                  className="border border-gray-300 rounded-lg w-full object-contain"
                />
              )}
            </div>

            <div className="w-full md:max-w-[50%] mx-auto">
              <h3 className="font-medium mb-2">Dark Theme (Cropped)</h3>
              {croppedDark && (
                <img
                  src={croppedDark}
                  alt="Cropped dark theme"
                  className="border border-gray-300 rounded-lg w-full object-contain"
                />
              )}
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
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="circle"
                  checked={splitDirection === 'circle'}
                  onChange={() => setSplitDirection('circle')}
                  className="mr-2"
                />
                Circle (Center)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitDirection"
                  value="wave"
                  checked={splitDirection === 'wave'}
                  onChange={() => setSplitDirection('wave')}
                  className="mr-2"
                />
                Wave (Middle)
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
                  : 'bg-[#11b1b4] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white'
              }`}
            >
              {isProcessing ? 'Stitching...' : 'Stitch Images'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Step 4: Download Result</h2>

          <div className="text-center">
            <h3 className="font-medium mb-2">Stitched Image</h3>
            {stitchedImage && (
              <img
                src={stitchedImage}
                alt="Stitched theme image"
                className="max-w-1/2 border border-gray-300 rounded-lg mx-auto object-contain"
              />
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg border border-[#373A39] hover:border-[#454847]"
            >
              Back
            </button>
            <div className="space-x-4">
              <button
                onClick={resetTool}
                className="px-6 py-2 bg-[#EBEEEC] hover:bg-[#E2E6E4] dark:bg-[#EBEEED] dark:hover:bg-[#B0B4B3] text-black rounded-lg"
              >
                Start Over
              </button>
              <button
                onClick={downloadImage}
                className="px-6 py-2 bg-[#ebeeec] hover:bg-[#00A5A8] dark:bg-[#2bbdc0] dark:hover:bg-[#11B1B4] text-white rounded-lg"
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}