
import { img, img1, img2 } from "./svg-is3qy";

// Image imports
import tag from "./img/tag.png";

type ButtonProps = {
  className?: string;
  showIconLeft?: boolean;
  showIconRight?: boolean;
  showText?: boolean;
  type?: "Plan - Icon" | "Plan - Default" | "Plan - Small" | "Filled - Icon" | "Filled - Default" | "Filled - Small";
};

function Button({ className, showIconLeft = true, showIconRight = true, showText = true, type = "Plan - Icon" }: ButtonProps) {
  if (type === "Filled - Default") {
    return (
      <div className={className} data-name="Type=Filled - Default" data-node-id="10:3187">
        <div className="box-border content-stretch flex gap-[var(--margin\/xxs,8px)] items-center justify-center overflow-clip px-[var(--display\/buttonmarginv,20px)] py-[var(--display\/buttonmarginh_2,12px)] relative rounded-[inherit]">
          <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[color:var(--colors\/main-01,#2a587c)] text-[length:var(--font\/main---regular,16px)] text-nowrap whitespace-pre" data-node-id="10:3188">
            Our Surf Experience
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Type=Plan - Icon" data-node-id="10:3177">
      {showIconLeft && (
        <div className="overflow-clip relative shrink-0 size-[32px]" data-name="iconLeft" data-node-id="10:3178">
          <div className="absolute bottom-0 contents left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I10:3178;112:496">
            <div className="absolute bottom-0 left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I10:3178;112:497">
              <img alt="" className="block max-w-none size-full" src={img} />
            </div>
          </div>
        </div>
      )}
      {showText && (
        <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[color:var(--colors\/white,#ffffff)] text-[length:var(--font\/main---regular,16px)] text-nowrap whitespace-pre" data-node-id="10:3179">
          Our Surf Experience
        </p>
      )}
      {showIconRight && (
        <div className="overflow-clip relative shrink-0 size-[32px]" data-name="iconRight" data-node-id="10:3180">
          <div className="absolute bottom-0 contents left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I10:3180;112:496">
            <div className="absolute bottom-0 left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I10:3180;112:497">
              <img alt="" className="block max-w-none size-full" src={img} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ className }: { className?: string }) {
  return (
    <div className={className} data-name="tag" data-node-id="10:3227">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-none not-italic relative shrink-0 text-[color:var(--colors\/white,#ffffff)] text-[length:var(--font\/h6,12px)] text-nowrap uppercase whitespace-pre" data-node-id="10:3228">
        Our Surf Experience
      </p>
    </div>
  );
}
type SlideshowProps = {
  className?: string;
  type?: "Regular" | "leftImage" | "rightImage" | "textImage";
  device?: "Mobile" | "Desktop" | "Tablet";
};

function Slideshow({ className, type = "Regular", device = "Desktop" }: SlideshowProps) {
  if (type === "leftImage" && device === "Desktop") {
    return (
      <div className={className} data-name="Type=leftImage, Device=Desktop" data-node-id="10:3295">
        <div className="h-[330px] mr-[-380px] opacity-50 relative rounded-[var(--corner\/corner---r,20px)] shrink-0 w-[469px]" data-name="image" data-node-id="10:3296">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[var(--corner\/corner---r,20px)] size-full" src={tag} />
        </div>
        <div className="basis-0 grow h-full min-h-px min-w-px mr-[-380px] overflow-clip relative rounded-[var(--corner\/corner---r,20px)] shrink-0" data-name="image" data-node-id="10:3297">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[var(--corner\/corner---r,20px)] size-full" src={tag} />
          <div className="absolute bottom-[10px] content-stretch flex gap-[var(--margin\/ms,20px)] items-center right-[20px]" data-name="controls" data-node-id="10:3298">
            <div className="opacity-50 overflow-clip relative shrink-0 size-[32px]" data-name="Icons" data-node-id="I10:3298;112:1070">
              <div className="absolute h-[14px] left-[37.5%] right-[37.5%] top-1/2 translate-y-[-50%]" data-name="Vector" data-node-id="I10:3298;112:1070;112:1051">
                <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                  <img alt="" className="block max-w-none size-full" src={img1} />
                </div>
              </div>
            </div>
            <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icons" data-node-id="I10:3298;112:1071">
              <div className="absolute flex h-[14px] items-center justify-center left-[37.5%] right-[37.5%] top-1/2 translate-y-[-50%]">
                <div className="flex-none h-[14px] rotate-[180deg] scale-y-[-100%] w-[8px]">
                  <div className="relative size-full" data-name="Vector" data-node-id="I10:3298;112:1071;112:1055">
                    <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                      <img alt="" className="block max-w-none size-full" src={img2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Type=Regular, Device=Desktop" data-node-id="10:3293">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[var(--corner\/corner---r,20px)] size-full" src={tag} />
      <div className="absolute bottom-[10px] content-stretch flex gap-[var(--margin\/ms,20px)] items-center right-[20px]" data-name="controls" data-node-id="10:3294">
        <div className="opacity-50 overflow-clip relative shrink-0 size-[32px]" data-name="Icons" data-node-id="I10:3294;112:1070">
          <div className="absolute h-[14px] left-[37.5%] right-[37.5%] top-1/2 translate-y-[-50%]" data-name="Vector" data-node-id="I10:3294;112:1070;112:1051">
            <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
              <img alt="" className="block max-w-none size-full" src={img1} />
            </div>
          </div>
        </div>
        <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icons" data-node-id="I10:3294;112:1071">
          <div className="absolute flex h-[14px] items-center justify-center left-[37.5%] right-[37.5%] top-1/2 translate-y-[-50%]">
            <div className="flex-none h-[14px] rotate-[180deg] scale-y-[-100%] w-[8px]">
              <div className="relative size-full" data-name="Vector" data-node-id="I10:3294;112:1071;112:1055">
                <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                  <img alt="" className="block max-w-none size-full" src={img2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
type TabsComponentProps = {
  className?: string;
  state?: "active" | "unactive";
};

function TabsComponent({ className, state = "active" }: TabsComponentProps) {
  if (state === "unactive") {
    return (
      <div className={className} data-name="state=unactive" data-node-id="10:3267">
        <p className="font-['Poppins:SemiBold',sans-serif] leading-none not-italic opacity-50 relative shrink-0 text-[color:var(--colors\/main-01,#2a587c)] text-[length:var(--font\/h5,14px)] text-nowrap uppercase whitespace-pre" data-node-id="10:3268">
          right
        </p>
        <div className="bg-[var(--colors\/main-01,#2a587c)] h-[2px] opacity-0 shrink-0 w-full" data-node-id="10:3269" />
      </div>
    );
  }
  return (
    <div className={className} data-name="state=active" data-node-id="10:3264">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-none not-italic relative shrink-0 text-[color:var(--colors\/main-01,#2a587c)] text-[length:var(--font\/h5,14px)] text-nowrap uppercase whitespace-pre" data-node-id="10:3265">
        right
      </p>
      <div className="bg-[var(--colors\/main-01,#2a587c)] h-[2px] shrink-0 w-full" data-node-id="10:3266" />
    </div>
  );
}
type TabProps = {
  className?: string;
  property1?: "right" | "left";
};

function Tab({ className, property1 = "right" }: TabProps) {
  const element = <TabsComponent className="content-stretch flex flex-col gap-[var(--margin\/xxs,8px)] items-end relative shrink-0" state="unactive" />;
  if (property1 === "left") {
    return (
      <div className={className} data-name="Property 1=left" data-node-id="10:3277">
        <TabsComponent className="content-stretch flex flex-col gap-[var(--margin\/xxs,8px)] items-end relative shrink-0" state="unactive" />
        {element}
        {element}
        {element}
        <TabsComponent className="content-stretch flex flex-col gap-[var(--margin\/xxs,8px)] items-end relative shrink-0" />
      </div>
    );
  }
  return (
    <div className={className} data-name="Property 1=right" data-node-id="10:3271">
      <TabsComponent className="content-stretch flex flex-col gap-[var(--margin\/xxs,8px)] items-end relative shrink-0" />
      {element}
      {element}
      {element}
      <TabsComponent className="content-stretch flex flex-col gap-[var(--margin\/xxs,8px)] items-end relative shrink-0" state="unactive" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#f0d9b5] box-border content-stretch flex flex-col items-start px-0 py-[40px] relative size-full" data-name="Home" data-node-id="425:2237">
      <div className="box-border content-stretch flex gap-[var(--margin\/m,24px)] items-start pb-[var(--margin\/l,40px)] pt-0 px-[var(--display\/container,32px)] relative shrink-0 w-full" data-name="ImageText" data-node-id="425:2238">
        <div className="basis-0 content-stretch flex flex-col gap-[var(--margin\/s,16px)] grow items-end min-h-px min-w-[380px] relative self-stretch shrink-0" data-name="slideshowTabs" data-node-id="I425:2238;131:261804">
          <Tab className="box-border content-stretch flex gap-[var(--margin\/r,32px)] items-center px-[var(--margin\/xxs,8px)] py-0 relative shrink-0" property1="left" />
          <Slideshow className="basis-0 box-border content-stretch flex grow items-center min-h-px min-w-px pl-0 pr-[380px] py-0 relative shrink-0 w-full" type="leftImage" />
        </div>
        <div className="bg-[var(--colors\/white,#ffffff)] box-border content-stretch flex flex-col gap-[var(--margin\/r,32px)] items-start max-w-[480px] min-w-[380px] overflow-clip px-[var(--margin\/r,32px)] py-[var(--margin\/l,40px)] relative rounded-[var(--corner\/corner---l,28px)] shrink-0 w-[480px]" data-name="Cards" data-node-id="I425:2238;114:861">
          <div className="content-stretch flex flex-col gap-[var(--margin\/xs,12px)] items-start leading-none not-italic relative shrink-0 uppercase w-full" data-name="introText" data-node-id="I425:2238;114:861;112:1119">
            <p className="font-['Poppins:SemiBold',sans-serif] relative shrink-0 text-[color:var(--colors\/extra-02,#a1141f)] text-[length:var(--font\/h5,14px)] w-full" data-node-id="I425:2238;114:861;112:1120">
              Home of perfect waves
            </p>
            <p className="font-['Poppins:Black',sans-serif] relative shrink-0 text-[color:var(--colors\/main-01,#2a587c)] text-[length:var(--font\/h2--big,42px)] w-full" data-node-id="I425:2238;114:861;112:1121">
              Home of perfect waves
            </p>
          </div>
          <div className="font-['Poppins:Regular',sans-serif] leading-[1.5] max-w-[340px] not-italic relative shrink-0 text-[color:var(--colors\/black,#000000)] text-[length:var(--font\/main---regular,16px)] w-full" data-node-id="I425:2238;114:861;112:1122">
            <p className="mb-0">{`The Mentawai Islands offer some of the world's most consistent and powerful waves. `}</p>
            <p className="mb-0 text-[16px]">&nbsp;</p>
            <p className="mb-0">With over 70 world-class breaks, this remote paradise delivers year-round swells that break over pristine reefs.</p>
            <p className="mb-0 text-[16px]">&nbsp;</p>
            <p className="mb-0">Every session promises waves of exceptional quality - from legendary tubes to endless perfect walls that seem crafted by nature specifically for surfing.</p>
            <p className="text-[16px]">&nbsp;</p>
          </div>
          <div className="content-start flex flex-wrap gap-[var(--margin\/xs,12px)] items-start relative shrink-0 w-full" data-name="Buittons" data-node-id="I425:2238;114:861;112:1123">
            <div className="bg-[var(--colors\/main-01,#2a587c)] box-border content-stretch flex gap-[var(--margin\/xxs,8px)] items-center justify-center overflow-clip px-[var(--display\/buttonmarginv,20px)] py-[var(--display\/buttonmarginh,8px)] relative rounded-[var(--corner\/corner---xs,8px)] shrink-0" data-name="Button01" data-node-id="I425:2238;114:861;112:1124">
              <div className="overflow-clip relative shrink-0 size-[32px]" data-name="iconLeft" data-node-id="I425:2238;114:861;112:1124;112:878">
                <div className="absolute bottom-0 contents left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I425:2238;114:861;112:1124;112:878;112:496">
                  <div className="absolute bottom-0 left-[4.16%] right-[4.17%] top-0" data-name="Group" data-node-id="I425:2238;114:861;112:1124;112:878;112:497">
                    <img alt="" className="block max-w-none size-full" src={img} />
                  </div>
                </div>
              </div>
              <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[color:var(--colors\/white,#ffffff)] text-[length:var(--font\/main---regular,16px)] text-nowrap whitespace-pre" data-node-id="I425:2238;114:861;112:1124;112:413">
                Our Surf Experience
              </p>
            </div>
            <Button className="border border-[var(--colors\/main-01,#2a587c)] border-solid relative rounded-[var(--corner\/corner---xs,8px)] shrink-0" type="Filled - Default" />
          </div>
        </div>
      </div>
    </div>
  );
}