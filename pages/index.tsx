"use client";
import { useEffect, useState, useRef } from "react";
import MomenceSchedule from "../components/MomenceSchedule";

interface ScheduleItem {
  title: string;
  time: string;
  teacher: string;
  date: string;
}

export default function ScheduleScraper() {
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComponentLoaded, setIsComponentLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(
    "/default-schedule-pic.webp"
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showPromoGraphic, setShowPromoGraphic] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if the component has mounted and the script is loading
    const checkComponentLoaded = () => {
      const scheduleContainer = document.querySelector("#ribbon-schedule");
      const script = document.querySelector('script[src*="momence.com"]');

      console.log("Schedule container found:", !!scheduleContainer);
      console.log("Momence script found:", !!script);

      if (scheduleContainer) {
        setIsComponentLoaded(true);
        console.log("Component loaded successfully");
      } else {
        // Check again in a second
        setTimeout(checkComponentLoaded, 1000);
      }
    };

    // Start checking after a short delay
    const timer = setTimeout(checkComponentLoaded, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update available dates when schedule data changes
  useEffect(() => {
    if (scheduleData.length > 0) {
      const dates = Array.from(
        new Set(scheduleData.map((item) => item.date))
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [scheduleData, selectedDate]);

  // Auto-regenerate insta story when selected date changes or image is uploaded
  useEffect(() => {
    if (selectedDate && scheduleData.length > 0 && showPromoGraphic) {
      // Render the insta story after a short delay to ensure the canvas is ready
      setTimeout(() => {
        renderPromoGraphic();
      }, 100);
    }
  }, [selectedDate, scheduleData, showPromoGraphic, selectedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePromoGraphic = () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }
    setShowPromoGraphic(true);

    // Render the canvas after a short delay to ensure the canvas is in the DOM
    setTimeout(() => {
      renderPromoGraphic();
    }, 100);
  };

  const renderPromoGraphic = () => {
    const canvas = document.getElementById("promoCanvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the current selectedDate state
    if (!selectedDate) return;

    const bg = new Image();
    const logo = new Image();
    const scheduleBg = new Image();
    bg.src = selectedImage;
    logo.src = "/las-olas-yoga-white.png";
    scheduleBg.src = "/schedule-background.jpeg";

    const onceBothLoaded = () => {
      if (!bg.complete || !logo.complete || !scheduleBg.complete) return;
      // base colors
      const pill = "#EDE7E1";
      const dark = "#69503c";
      const muted = "#a58367";
      const white = "#FFFFFF";

      // helpers
      const roundedRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // canvas bg
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // photo (top ~50%)
      const photoH = Math.round(canvas.height * 0.5);

      // Draw schedule background for bottom half
      const scheduleBgH = canvas.height - photoH;
      const scheduleArImg = scheduleBg.width / scheduleBg.height;
      const scheduleArCan = canvas.width / scheduleBgH;

      // compute source crop rect to "cover" the bottom area
      let scheduleSx = 0,
        scheduleSy = 0,
        scheduleSw = scheduleBg.width,
        scheduleSh = scheduleBg.height;
      if (scheduleArImg > scheduleArCan) {
        // crop sides
        scheduleSh = scheduleBg.height;
        scheduleSw = scheduleSh * scheduleArCan;
        scheduleSx = (scheduleBg.width - scheduleSw) / 2;
      } else {
        // crop top/bottom
        scheduleSw = scheduleBg.width;
        scheduleSh = scheduleSw / scheduleArCan;
        scheduleSy = (scheduleBg.height - scheduleSh) / 2;
      }

      // draw schedule background into the bottom area
      ctx.drawImage(
        scheduleBg,
        scheduleSx,
        scheduleSy,
        scheduleSw,
        scheduleSh,
        0,
        photoH,
        canvas.width,
        scheduleBgH
      );
      const arImg = bg.width / bg.height;
      const arCan = canvas.width / photoH;

      // compute source crop rect to "cover" the target area
      let sx = 0,
        sy = 0,
        sw = bg.width,
        sh = bg.height;
      if (arImg > arCan) {
        // crop sides
        sh = bg.height;
        sw = sh * arCan;
        sx = (bg.width - sw) / 2;
      } else {
        // crop top/bottom
        sw = bg.width;
        sh = sw / arCan;
        sy = (bg.height - sh) / 2;
      }

      // draw exactly into the 55% area
      ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, canvas.width, photoH);
      // soft edge at seam
      const g = ctx.createLinearGradient(0, photoH - 48, 0, photoH + 48);
      g.addColorStop(0, "rgba(0,0,0,0.15)");
      g.addColorStop(0.5, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, photoH);

      // “torn” paper shadow line
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, photoH - 12, canvas.width, 12);

      // logo (centered at seam)
      const logoTargetW = canvas.width * 0.3;
      const logoAr = logo.width / logo.height || 3.5;
      const logoW = logoTargetW;
      const logoH = logoW / logoAr;
      const logoX = (canvas.width - logoW) / 2;
      const logoY = photoH - Math.round(logoH * 0.5);
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);

      // headline: <DAY> SCHEDULE
      const day = new Date(selectedDate)
        .toLocaleDateString(undefined, { weekday: "long" })
        .toUpperCase();
      ctx.fillStyle = white;
      ctx.font = `700 ${Math.round(
        canvas.width * 0.07
      )}px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${day} SCHEDULE`, canvas.width / 2, photoH + logoH - 140);

      const fivePills = filteredScheduleItems.length === 5;

      // pills
      const firstY = photoH + logoH;
      const pillHeight = Math.round(canvas.height * (fivePills ? 0.06 : 0.08));
      const pillRadius = pillHeight / 2;
      const padX = Math.round(canvas.width * 0.06);
      const pillW = canvas.width - padX * 2;

      const drawItem = (item: ScheduleItem, row: number) => {
        const y = firstY + row * (pillHeight + 44);

        // pill bg
        ctx.fillStyle = pill;
        roundedRect(padX, y, pillW, pillHeight, pillRadius);
        ctx.fill();

        // vertical center
        const midY = y + pillHeight / 2;

        // time (left)
        ctx.fillStyle = dark;
        ctx.font = `700 ${Math.round(
          pillHeight * 0.21
        )}px Inter, Arial, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          item.time.replace(/ AM| PM/g, (m) => m.trim()),
          padX + 105,
          midY
        );

        // title (center top)
        ctx.textAlign = "left";
        ctx.fillStyle = dark;
        ctx.font = `700 ${Math.round(
          pillHeight * (item.title.length > 19 ? 0.15 : 0.3)
        )}px Inter, Arial, sans-serif`;
        ctx.fillText(
          (item.title || "").toUpperCase(),
          canvas.width / 2 - 200,
          midY - 40
        );

        // teacher (center bottom)
        ctx.fillStyle = muted;
        ctx.font = `${Math.round(
          pillHeight * 0.21
        )}px Inter, Arial, sans-serif`;
        ctx.fillText(
          (item.teacher
            ? `WITH ${item.teacher.replace("  ", " ")}`
            : ""
          ).toUpperCase(),
          canvas.width / 2 - 200,
          midY + (item.title.length > 19 ? 40 : 53)
        );
      };

      filteredScheduleItems.forEach((it, i) => drawItem(it, i));
    };

    if (bg.complete && logo.complete && scheduleBg.complete) onceBothLoaded();
    bg.onload = onceBothLoaded;
    logo.onload = onceBothLoaded;
    scheduleBg.onload = onceBothLoaded;
  };

  const downloadPromoGraphic = () => {
    const canvas = document.getElementById("promoCanvas") as HTMLCanvasElement;
    if (!canvas) return;

    // Check if we're on a mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      // For mobile, display the image directly so users can long-press to save
      const img = canvas.toDataURL("image/png");

      // Create a modal or overlay to show the image
      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        padding: 20px;
      `;

      const imgElement = document.createElement("img");
      imgElement.src = img;
      imgElement.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
      `;

      // Add close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "×";
      closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      closeButton.onclick = () => {
        document.body.removeChild(modal);
      };

      modal.appendChild(imgElement);
      modal.appendChild(closeButton);
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      };

      document.body.appendChild(modal);
    } else {
      // Desktop: use traditional download
      const link = document.createElement("a");
      link.download = `las-olas-yoga-${selectedDate
        .replace(/\s+/g, "-")
        .toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const startScraping = () => {
    setIsLoading(true);
    setError(null);

    const waitForSchedule = () => {
      const scheduleContainer = document.querySelector("#ribbon-schedule");
      console.log("Scraping - Schedule container found:", !!scheduleContainer);

      if (scheduleContainer) {
        // Check for any content in the schedule container
        const textContent = scheduleContainer.textContent?.trim() || "";
        const hasContent =
          scheduleContainer.children.length > 0 || textContent.length > 0;
        console.log("Schedule container has content:", hasContent);
        console.log(
          "Schedule container children:",
          scheduleContainer.children.length
        );
        console.log("Schedule container text length:", textContent.length);

        if (hasContent) {
          extractScheduleData();
        } else {
          // If no content yet, wait and try again
          setTimeout(waitForSchedule, 1000);
        }
      } else {
        setError(
          "Schedule container not found. Please make sure the schedule component has loaded."
        );
        setIsLoading(false);
      }
    };

    // Start checking for schedule data
    setTimeout(waitForSchedule, 1000);
  };

  const extractScheduleData = () => {
    try {
      const scheduleContainer = document.querySelector("#ribbon-schedule");
      if (!scheduleContainer) {
        setError("Schedule container not found");
        setIsLoading(false);
        return;
      }

      const scheduleItems = scheduleContainer.querySelectorAll(
        ".momence-host_schedule-session_list-item"
      );

      processScheduleItems(scheduleItems);
    } catch (err) {
      setError(
        `Error extracting schedule data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsLoading(false);
    }
  };

  const processContainerText = (containerText: string) => {
    const extractedData: ScheduleItem[] = [];
    const lines = containerText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    lines.forEach((line, index) => {
      if (line.trim().length > 5) {
        // Only add lines with substantial content
        const cleanLine = line.trim();

        // Skip lines that might be "Unknown Class" or similar
        if (
          cleanLine.toLowerCase().includes("unknown") ||
          cleanLine.toLowerCase().includes("not available")
        ) {
          return;
        }

        // Skip items in fallback mode since they won't have all required fields
        console.log("Skipping fallback item - missing required fields");
      }
    });

    setScheduleData(extractedData);
    setIsLoading(false);
  };

  const processScheduleItems = (items: NodeListOf<Element>) => {
    const extractedData: ScheduleItem[] = [];

    items.forEach((item) => {
      try {
        // Extract text content and try to parse schedule information
        const textContent = item.textContent?.trim();
        if (!textContent) return;

        // Try to extract structured data if available
        const titleElement = item.querySelector(
          ".momence-host_schedule-session_list-item-title"
        );
        const timeElement = item.querySelector(".momence-session-duration");
        const teacherElement = item.querySelector(".momence-session-teacher");
        const dateElement = item.querySelector(".momence-session-starts_at");
        const bookElement = item.querySelector(
          ".momence-host_schedule-session-list-item-wrapper"
        );

        const title = titleElement?.textContent?.trim();
        let time = timeElement?.textContent?.trim();
        let teacher = teacherElement?.textContent?.trim();
        const date = dateElement?.textContent?.trim();
        const bookText = bookElement?.textContent?.trim();

        // Skip items with no title or "Unknown Class" title
        if (!title || title === "Unknown Class") {
          return;
        }

        if (bookText === "Cancelled") return;

        // Skip items that don't have all required fields
        if (!time || !teacher || !date) {
          return;
        }

        // Remove "Show bio" from teacher names
        teacher = teacher.replace(/Show bio/gi, "").trim();

        // Clean up time format - remove duration (e.g., "2:00 PM - 3:15 PM75 min" -> "2:00 PM - 3:15 PM")
        time = time.replace(/\d+\s*min/gi, "").trim();

        extractedData.push({
          title,
          time,
          teacher,
          date,
        });
      } catch (err) {
        console.warn("Error processing schedule item:", err);
      }
    });

    if (extractedData.length === 0) {
      // Fallback: try to extract any meaningful text from the container
      const containerText =
        document.querySelector("#ribbon-schedule")?.textContent;
      if (containerText) {
        processContainerText(containerText);
        return;
      }
    }

    // Remove duplicates based on title, time, teacher, and date
    const uniqueData = extractedData.filter((item, index, self) => {
      const key = `${item.title}-${item.time}-${item.teacher}-${item.date}`;
      return (
        index ===
        self.findIndex(
          (other) =>
            `${other.title}-${other.time}-${other.teacher}-${other.date}` ===
            key
        )
      );
    });

    setScheduleData(uniqueData);
    setIsLoading(false);

    // Automatically generate insta story when data is loaded
    if (uniqueData.length > 0) {
      // Set the first available date as selected
      const firstDate = uniqueData[0].date;
      setSelectedDate(firstDate);

      // Show the insta story section
      setShowPromoGraphic(true);

      // Render the insta story after a short delay to ensure state updates
      setTimeout(() => {
        renderPromoGraphic();
      }, 200);
    }
  };

  const copyToClipboard = () => {
    const textArray = scheduleData
      .map((item) => {
        const parts = [item.title];
        if (item.time) parts.push(item.time);
        if (item.teacher) parts.push(item.teacher);
        if (item.date) parts.push(item.date);
        return parts.join(" - ");
      })
      .join("\n");

    navigator.clipboard
      .writeText(textArray)
      .then(() => {
        alert("Schedule data copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
      });
  };

  const filteredScheduleItems = scheduleData.filter(
    (item) => item.date === selectedDate
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-center text-3xl font-bold">
          Insta Story Generator
        </h1>

        {/* Component Status, Controls, and Results */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 rounded bg-gray-50 p-4">
            <p className="text-sm">
              {isComponentLoaded
                ? "✅ Loaded schedule data"
                : "⏳ Loading schedule data..."}
            </p>
            <button
              onClick={startScraping}
              disabled={isLoading || !isComponentLoaded}
              className="mt-3 rounded px-4 py-2 text-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400"
              style={{ backgroundColor: "#a58367" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#8b6f55")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#a58367")
              }
            >
              {isLoading ? "Getting data..." : "Generate Image"}
            </button>
          </div>

          {isLoading && (
            <div className="py-8 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading schedule data...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!isLoading && !error && scheduleData.length > 0 && (
            <div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Image Upload */}
                <div>
                  <h3 className="mb-3 font-semibold">
                    Upload Custom Background Image
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded px-4 py-2 text-white transition-colors cursor-pointer"
                    style={{ backgroundColor: "#a58367" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#8b6f55")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#a58367")
                    }
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Date Dropdown */}
                <div>
                  <h3 className="mb-3 font-semibold">Select Date</h3>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a date...</option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                  {selectedDate && (
                    <div className="mt-3 rounded bg-gray-50 p-3">
                      <h4 className="mb-2 font-semibold">
                        Classes for {selectedDate}:
                      </h4>
                      {filteredScheduleItems.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {filteredScheduleItems.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.time}</span>
                              <span>
                                {item.title} with {item.teacher}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No classes found for this date
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-generation notice */}
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-green-800 font-medium">
                  ✅ Insta story will be generated automatically when schedule
                  data is loaded and updates when you change the date
                </p>
              </div>
            </div>
          )}

          {/* Insta story Display */}
          {showPromoGraphic && selectedDate && (
            <div>
              <div className="my-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Generated Insta story</h2>
                <button
                  onClick={downloadPromoGraphic}
                  className="rounded px-4 py-2 text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: "#a58367" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#8b6f55")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#a58367")
                  }
                >
                  Download Image
                </button>
              </div>

              <div className="flex justify-left" style={{ overflow: "hidden" }}>
                <canvas
                  id="promoCanvas"
                  width="2160"
                  height="3840"
                  className="rounded-2xl shadow-2xl"
                  style={{
                    imageRendering: "crisp-edges",
                    transform: "scale(0.15)",
                    transformOrigin: "left top",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* MomenceSchedule component */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Schedule Component:</h3>
          <div className="rounded border border-gray-300 bg-gray-50 p-4">
            <MomenceSchedule />
          </div>
        </div>
      </div>
    </div>
  );
}
