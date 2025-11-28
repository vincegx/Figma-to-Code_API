

import { imgVector, imgLogo, imgUnion, imgVector1, imgUnion1, imgVector2, img, img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, img15, img16, imgVector3, imgVector4, imgVector5, imgShape, imgShape1, imgShape2, imgShape3, imgVector6, imgVector7, imgVector8, img17, img18, img24, img25 } from "./svg-fetij";

// Image imports
import mobileSwitchYes from "./img/mobileSwitchYes.png";
import styleStyle02SwitchMobileNo from "./img/styleStyle02SwitchMobileNo.png";
import content2 from "./img/content2.png";
import img20 from "./img/20.png";
import image from "./img/image.png";
import content3 from "./img/content3.png";
import image88 from "./img/image88.png";

type BrandingProps = {
  className?: string;
  type?: "Logo 01" | "Logo 02" | "Logo 03" | "Icon 01" | "Icon 02" | "Icon 03";
  dark?: boolean;
  switchMobile?: boolean;
};

function Branding({ className, type = "Logo 01", dark = true, switchMobile = false }: BrandingProps) {
  if (type === "Icon 03" && !dark && !switchMobile) {
    return (
      <div className={className} data-name="Type=Icon 03, Dark=No, Switch Mobile=No" data-node-id="425:2521">
        <div className="absolute h-[29.268px] left-[0.38px] top-[calc(50%+0.3px)] translate-y-[-50%] w-[29.267px]" data-name="Vector" data-node-id="425:2522">
          <img alt="" className="block max-w-none size-full" src={imgVector} />
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Type=Logo 01, Dark=Yes, Switch Mobile=No" data-node-id="425:2284">
      <div className="absolute h-[26.687px] left-0 top-[6.31px] w-[119px]" data-name="Logo" data-node-id="425:2285">
        <img alt="" className="block max-w-none size-full" src={imgLogo} />
      </div>
    </div>
  );
}

function IconEmail({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/email" data-node-id="425:4270">
      <div className="absolute inset-[17.28%_8.24%_18.14%_10.51%]" data-name="Union" data-node-id="425:4271">
        <img alt="" className="block max-w-none size-full" src={imgUnion} />
      </div>
    </div>
  );
}

function IconTwitter({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/twitter" data-node-id="425:4255">
      <div className="absolute inset-[15.81%_9.85%_17.39%_6.82%]" data-name="Vector" data-node-id="425:4256">
        <div className="absolute inset-[-4.67%_-3.75%_-4.68%_-3.75%]">
          <img alt="" className="block max-w-none size-full" src={imgVector1} />
        </div>
      </div>
    </div>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/instagram" data-node-id="425:4250">
      <div className="absolute inset-[13.32%_12.19%_13.76%_14.89%]" data-name="Union" data-node-id="425:4251">
        <img alt="" className="block max-w-none size-full" src={imgUnion1} />
      </div>
    </div>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/facebook" data-node-id="425:4248">
      <div className="absolute inset-[12.28%_26.73%_12.72%_27.43%]" data-name="Vector" data-node-id="425:4249">
        <div className="absolute inset-[-4.17%_-6.82%]">
          <img alt="" className="block max-w-none size-full" src={imgVector2} />
        </div>
      </div>
    </div>
  );
}
type SocialIconsProps = {
  className?: string;
  facebook?: boolean;
  instagram?: boolean;
  twitter?: boolean;
  linkedIn?: boolean;
  email?: boolean;
  pinterest?: boolean;
  tikTok?: boolean;
  style?: "Style 01" | "Style 02";
  color?: "Light" | "Dark";
};

function SocialIcons({ className, facebook = true, instagram = true, twitter = true, linkedIn = false, email = true, pinterest = false, tikTok = false, style = "Style 01", color = "Light" }: SocialIconsProps) {
  if (style === "Style 01" && color === "Dark") {
    return (
      <div className={className} data-name="Style=Style 01, Color=Dark" data-node-id="425:4284">
        <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Icons" data-node-id="425:4285">
          {facebook && (
            <div className="bg-[#383838] relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4286">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/facebook" data-node-id="I425:4286;130:40140">
                <div className="absolute inset-[12.28%_26.73%_12.72%_27.43%]" data-name="Vector" data-node-id="I425:4286;130:40140;129:26358">
                  <div className="absolute inset-[-5.56%_-9.09%]" style={{ "--stroke-0": "rgba(234, 236, 240, 1)" } as React.CSSProperties}>
                    <img alt="" className="block max-w-none size-full" src={img} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {instagram && (
            <div className="bg-[#383838] relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4287">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/instagram" data-node-id="I425:4287;130:40140">
                <div className="absolute inset-[13.32%_12.19%_13.76%_14.89%]" data-name="Union" data-node-id="I425:4287;130:40140;130:23111">
                  <div className="absolute inset-0" style={{ "--fill-0": "rgba(234, 236, 240, 1)" } as React.CSSProperties}>
                    <img alt="" className="block max-w-none size-full" src={img1} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {twitter && (
            <div className="bg-[#383838] relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4288">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/twitter" data-node-id="I425:4288;130:40140">
                <div className="absolute inset-[15.81%_9.85%_17.39%_6.82%]" data-name="Vector" data-node-id="I425:4288;130:40140;129:27394">
                  <div className="absolute inset-[-6.23%_-5%_-6.24%_-5%]" style={{ "--stroke-0": "rgba(234, 236, 240, 1)" } as React.CSSProperties}>
                    <img alt="" className="block max-w-none size-full" src={img2} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {pinterest && (
            <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4289">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/Pinterest" data-node-id="I425:4289;130:40140">
                <div className="absolute bottom-[16.67%] left-[33.33%] right-1/2 top-[45.83%]" data-name="Vector" data-node-id="I425:4289;130:40140;249:96187">
                  <div className="absolute inset-[-11.11%_-25.01%]">
                    <img alt="" className="block max-w-none size-full" src={img3} />
                  </div>
                </div>
                <div className="absolute inset-[29.14%_29.17%_33.33%_29.17%]" data-name="Vector" data-node-id="I425:4289;130:40140;249:96188">
                  <div className="absolute inset-[-11.1%_-10%]">
                    <img alt="" className="block max-w-none size-full" src={img4} />
                  </div>
                </div>
                <div className="absolute inset-[12.5%]" data-name="Vector" data-node-id="I425:4289;130:40140;249:96189">
                  <div className="absolute inset-[-5.56%]">
                    <img alt="" className="block max-w-none size-full" src={img5} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {tikTok && (
            <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4290">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/tiktok" data-node-id="I425:4290;130:40140">
                <div className="absolute inset-[16.23%_24.08%_17.1%_21.75%]" data-name="Vector" data-node-id="I425:4290;130:40140;129:27679">
                  <div className="absolute inset-[-6.25%_-7.69%]">
                    <img alt="" className="block max-w-none size-full" src={img6} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {linkedIn && (
            <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4291">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/linkedin" data-node-id="I425:4291;130:40140">
                <div className="absolute inset-[13.54%]" data-name="Union" data-node-id="I425:4291;130:40140;245:95521">
                  <img alt="" className="block max-w-none size-full" src={img7} />
                </div>
              </div>
            </div>
          )}
          {email && (
            <div className="bg-[#383838] relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4292">
              <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/email" data-node-id="I425:4292;130:40140">
                <div className="absolute inset-[17.28%_8.24%_18.14%_10.51%]" data-name="Union" data-node-id="I425:4292;130:40140;130:21965">
                  <div className="absolute inset-0" style={{ "--fill-0": "rgba(234, 236, 240, 1)" } as React.CSSProperties}>
                    <img alt="" className="block max-w-none size-full" src={img8} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Style=Style 01, Color=Light" data-node-id="425:4275">
      <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Icons" data-node-id="425:4276">
        {facebook && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4277">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/facebook" data-node-id="I425:4277;130:40140">
              <div className="absolute inset-[12.28%_26.73%_12.72%_27.43%]" data-name="Vector" data-node-id="I425:4277;130:40140;129:26358">
                <div className="absolute inset-[-4.17%_-6.82%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector2} />
                </div>
              </div>
            </div>
          </div>
        )}
        {instagram && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4278">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/instagram" data-node-id="I425:4278;130:40140">
              <div className="absolute inset-[13.32%_12.19%_13.76%_14.89%]" data-name="Union" data-node-id="I425:4278;130:40140;130:23111">
                <img alt="" className="block max-w-none size-full" src={imgUnion1} />
              </div>
            </div>
          </div>
        )}
        {twitter && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4279">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/twitter" data-node-id="I425:4279;130:40140">
              <div className="absolute inset-[15.81%_9.85%_17.39%_6.82%]" data-name="Vector" data-node-id="I425:4279;130:40140;129:27394">
                <div className="absolute inset-[-4.67%_-3.75%_-4.68%_-3.75%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector1} />
                </div>
              </div>
            </div>
          </div>
        )}
        {pinterest && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4280">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/Pinterest" data-node-id="I425:4280;130:40140">
              <div className="absolute bottom-[16.67%] left-[33.33%] right-1/2 top-[45.83%]" data-name="Vector" data-node-id="I425:4280;130:40140;249:96187">
                <div className="absolute inset-[-8.34%_-18.75%]">
                  <img alt="" className="block max-w-none size-full" src={img9} />
                </div>
              </div>
              <div className="absolute inset-[29.14%_29.17%_33.33%_29.17%]" data-name="Vector" data-node-id="I425:4280;130:40140;249:96188">
                <div className="absolute inset-[-8.33%_-7.5%]">
                  <img alt="" className="block max-w-none size-full" src={img10} />
                </div>
              </div>
              <div className="absolute inset-[12.5%]" data-name="Vector" data-node-id="I425:4280;130:40140;249:96189">
                <div className="absolute inset-[-4.17%]">
                  <img alt="" className="block max-w-none size-full" src={img11} />
                </div>
              </div>
            </div>
          </div>
        )}
        {tikTok && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4281">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/tiktok" data-node-id="I425:4281;130:40140">
              <div className="absolute inset-[16.23%_24.08%_17.1%_21.75%]" data-name="Vector" data-node-id="I425:4281;130:40140;129:27679">
                <div className="absolute inset-[-4.69%_-5.77%]">
                  <img alt="" className="block max-w-none size-full" src={img12} />
                </div>
              </div>
            </div>
          </div>
        )}
        {linkedIn && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4282">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/linkedin" data-node-id="I425:4282;130:40140">
              <div className="absolute inset-[13.54%]" data-name="Union" data-node-id="I425:4282;130:40140;245:95521">
                <img alt="" className="block max-w-none size-full" src={img13} />
              </div>
            </div>
          </div>
        )}
        {email && (
          <div className="bg-white relative rounded-[100px] shrink-0 size-[36px]" data-name="Icon Box" data-node-id="425:4283">
            <div className="absolute left-1/2 size-[13.5px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon/email" data-node-id="I425:4283;130:40140">
              <div className="absolute inset-[17.28%_8.24%_18.14%_10.51%]" data-name="Union" data-node-id="I425:4283;130:40140;130:21965">
                <img alt="" className="block max-w-none size-full" src={imgUnion} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
type ElementsLogoCardProps = {
  className?: string;
  mobileSwitch?: boolean;
};

function ElementsLogoCard({ className, mobileSwitch = false }: ElementsLogoCardProps) {
  const element = <img alt="" className="block max-w-none size-full" src={img14} />;
  if (mobileSwitch) {
    return (
      <div className={className} data-name="Mobile Switch=Yes" data-node-id="425:4217">
        <div className="absolute box-border content-stretch flex flex-col gap-[6.4px] h-[25.6px] items-center justify-center left-[calc(50%-0.23px)] px-0 py-[17.6px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="Elements/Full Logos Mono" data-node-id="425:4218">
          <div className="h-[28.444px] relative shrink-0 w-[80.539px]" data-name="Vector" data-node-id="I425:4218;2021:153068">
            {element}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Mobile Switch=No" data-node-id="425:4215">
      <div className="absolute box-border content-stretch flex flex-col gap-[8px] h-[40px] items-center justify-center left-[calc(50%+0.34px)] px-0 py-[22px] top-[calc(50%-0.72px)] translate-x-[-50%] translate-y-[-50%]" data-name="Elements/Full Logos Mono" data-node-id="425:4216">
        <div className="h-[35.556px] relative shrink-0 w-[100.674px]" data-name="Vector" data-node-id="I425:4216;2021:153068">
          {element}
        </div>
      </div>
    </div>
  );
}
type ElementdPortfolioCardProps = {
  className?: string;
  switchMobile?: boolean;
};

function ElementdPortfolioCard({ className, switchMobile = false }: ElementdPortfolioCardProps) {
  return (
    <div className={className} data-name="Switch Mobile=No" data-node-id="425:3678">
      <div className="relative rounded-[24px] self-stretch shrink-0 w-[763px]" data-name="Image" data-node-id="425:3679">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[24px] size-full" src={mobileSwitchYes} />
      </div>
      <div className="basis-0 bg-[#f2f4f7] box-border content-stretch flex flex-col grow h-[702px] items-start justify-between min-h-px min-w-px overflow-clip p-[56px] relative rounded-[24px] shrink-0" data-name="Info" data-node-id="425:3680">
        <div className="content-stretch flex flex-col gap-[24px] items-start not-italic relative shrink-0 w-full" data-name="Header" data-node-id="425:3681">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[40px] relative shrink-0 text-[#282828] text-[34px] tracking-[-1px] w-full" data-node-id="425:3682">
            Korba
          </p>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[26px] relative shrink-0 text-[#5f6980] text-[16px] w-full" data-node-id="425:3683">
            Ut nunc, dui sit sit nisl, cras velit lorem. Laoreet gravida adipiscing augue sit justo elit. Mauris bibendum mattis et diam tellus. Auctor mauris felis lobortis tempus, magna nisl, proin amet. Et diam amet aliquet nisi egestas aenean nunc. Vitae, arcu euismod turpis in tempus tincidunt mattis tellus nisl.{" "}
          </p>
        </div>
        <div className="border-[#282828] border-[0px_0px_1px] border-solid box-border content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Button" data-node-id="425:3684">
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Container" data-node-id="I425:3684;195:30129">
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[#282828] text-[18px] text-nowrap tracking-[-0.2px] whitespace-pre" data-node-id="I425:3684;2:30788">
              Case Study
            </p>
          </div>
          <div className="relative shrink-0 size-[24px]" data-name="Icon/arrow-up-right" data-node-id="I425:3684;223:76352">
            <div className="absolute inset-[29.17%]" data-name="Vector" data-node-id="I425:3684;223:76352;525:132101">
              <div className="absolute inset-[-7.5%]">
                <img alt="" className="block max-w-none size-full" src={img15} />
              </div>
            </div>
            <div className="absolute inset-[29.17%_29.17%_33.33%_33.33%]" data-name="Vector" data-node-id="I425:3684;223:76352;525:132102">
              <div className="absolute inset-[-8.33%]">
                <img alt="" className="block max-w-none size-full" src={img16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconArrowDown({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/arrow-down" data-node-id="425:3145">
      <div className="absolute bottom-[20.83%] left-1/2 right-1/2 top-[20.83%]" data-name="Vector" data-node-id="425:3146">
        <div className="absolute inset-[-5.36%_-0.75px]">
          <img alt="" className="block max-w-none size-full" src={imgVector3} />
        </div>
      </div>
      <div className="absolute bottom-[20.83%] left-1/2 right-1/4 top-[54.17%]" data-name="Vector" data-node-id="425:3147">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector4} />
        </div>
      </div>
      <div className="absolute bottom-[20.83%] left-1/4 right-1/2 top-[54.17%]" data-name="Vector" data-node-id="425:3148">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector5} />
        </div>
      </div>
    </div>
  );
}
type ElementsNavigationDotsProps = {
  className?: string;
  style?: "Active 01" | "Active 2 Horizontal" | "Active 2 Vertical" | "Inactive";
  color?: "Light" | "Dark";
  switchMobile?: boolean;
};

function ElementsNavigationDots({ className, style = "Active 01", color = "Light", switchMobile = true }: ElementsNavigationDotsProps) {
  if (style === "Active 2 Horizontal" && color === "Light" && switchMobile) {
    return (
      <div className={className} data-name="Style=Active 2 Horizontal, Color=Light, Switch Mobile=Yes" data-node-id="425:3074">
        <div className="absolute bg-[#282828] h-[6px] left-0 rounded-[100px] top-[0.02px] w-[26px]" data-name="Shape" data-node-id="425:3075" />
      </div>
    );
  }
  if (style === "Active 2 Vertical" && color === "Light" && switchMobile) {
    return (
      <div className={className} data-name="Style=Active 2 Vertical, Color=Light, Switch Mobile=Yes" data-node-id="425:3078">
        <div className="absolute flex h-[26px] items-center justify-center left-0 top-0 w-[6px]" style={{ "--transform-inner-width": "26", "--transform-inner-height": "6" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg]">
            <div className="bg-[#282828] h-[6px] rounded-[100px] w-[26px]" data-name="Shape" data-node-id="425:3079" />
          </div>
        </div>
      </div>
    );
  }
  if (style === "Inactive" && color === "Light" && switchMobile) {
    return (
      <div className={className} data-name="Style=Inactive, Color=Light, Switch Mobile=Yes" data-node-id="425:3082">
        <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="425:3083">
          <img alt="" className="block max-w-none size-full" src={imgShape} />
        </div>
      </div>
    );
  }
  if (style === "Active 01" && color === "Light" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Active 01, Color=Light, Switch Mobile=No" data-node-id="425:3086">
        <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="425:3087">
          <img alt="" className="block max-w-none size-full" src={imgShape1} />
        </div>
      </div>
    );
  }
  if (style === "Active 2 Horizontal" && color === "Light" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Active 2 Horizontal, Color=Light, Switch Mobile=No" data-node-id="425:3090">
        <div className="absolute bg-[#282828] h-[8px] left-0 rounded-[100px] top-0 w-[30px]" data-name="Shape" data-node-id="425:3091" />
      </div>
    );
  }
  if (style === "Active 2 Vertical" && color === "Light" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Active 2 Vertical, Color=Light, Switch Mobile=No" data-node-id="425:3094">
        <div className="absolute flex h-[30px] items-center justify-center left-0 top-0 w-[8px]" style={{ "--transform-inner-width": "30", "--transform-inner-height": "8" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg]">
            <div className="bg-[#282828] h-[8px] rounded-[100px] w-[30px]" data-name="Shape" data-node-id="425:3095" />
          </div>
        </div>
      </div>
    );
  }
  if (style === "Inactive" && color === "Light" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Inactive, Color=Light, Switch Mobile=No" data-node-id="425:3098">
        <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="425:3099">
          <img alt="" className="block max-w-none size-full" src={imgShape2} />
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Style=Active 01, Color=Light, Switch Mobile=Yes" data-node-id="425:3070">
      <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="425:3071">
        <img alt="" className="block max-w-none size-full" src={imgShape3} />
      </div>
    </div>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/arrow-right" data-node-id="425:2592">
      <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2" data-name="Vector" data-node-id="425:2593">
        <div className="absolute inset-[-0.75px_-5.36%]">
          <img alt="" className="block max-w-none size-full" src={imgVector6} />
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[54.17%] right-[20.83%] top-1/2" data-name="Vector" data-node-id="425:2594">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector7} />
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[54.17%] right-[20.83%] top-1/4" data-name="Vector" data-node-id="425:2595">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector5} />
        </div>
      </div>
    </div>
  );
}

function IconArrowUp({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/arrow-up" data-node-id="425:3141">
      <div className="absolute bottom-[20.83%] left-1/2 right-1/2 top-[20.83%]" data-name="Vector" data-node-id="425:3142">
        <div className="absolute inset-[-5.36%_-0.75px]">
          <img alt="" className="block max-w-none size-full" src={imgVector3} />
        </div>
      </div>
      <div className="absolute bottom-[54.17%] left-1/2 right-1/4 top-[20.83%]" data-name="Vector" data-node-id="425:3143">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector8} />
        </div>
      </div>
      <div className="absolute bottom-[54.17%] left-1/4 right-1/2 top-[20.83%]" data-name="Vector" data-node-id="425:3144">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector7} />
        </div>
      </div>
    </div>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Icon/arrow-left" data-node-id="425:3101">
      <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2" data-name="Vector" data-node-id="425:3102">
        <div className="absolute inset-[-0.75px_-5.36%]">
          <img alt="" className="block max-w-none size-full" src={imgVector6} />
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[20.83%] right-[54.17%] top-1/2" data-name="Vector" data-node-id="425:3103">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector5} />
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[20.83%] right-[54.17%] top-1/4" data-name="Vector" data-node-id="425:3104">
        <div className="absolute inset-[-12.5%]">
          <img alt="" className="block max-w-none size-full" src={imgVector7} />
        </div>
      </div>
    </div>
  );
}
type NavigationDotsProps = {
  className?: string;
  orientation?: "Horizontal" | "Vertical";
  style?: "Style01" | "Style02" | "Style03" | "Style04" | "Style05" | "Style06" | "Style07";
  count?: "3 Items" | "4 Items" | "5 Items" | "6 Items" | "Arrows";
  switchMobile?: boolean;
};

function NavigationDots({ className, orientation = "Horizontal", style = "Style01", count = "3 Items", switchMobile = true }: NavigationDotsProps) {
  if (orientation === "Horizontal" && style === "Style01" && count === "3 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=3 Items, Switch Mobile=No" data-node-id="425:3154">
        <div className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" data-name="Elements/Navigation Dots" data-node-id="425:3155">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3155;196:30869">
            <img alt="" className="block max-w-none size-full" src={imgShape1} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3156">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3156;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3157">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3157;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "4 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=4 Items, Switch Mobile=Yes" data-node-id="425:3214">
        <div className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" data-name="Elements/Navigation Dots" data-node-id="425:3215">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3215;196:30669">
            <img alt="" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3216">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3216;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3217">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3217;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3218">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3218;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "4 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=4 Items, Switch Mobile=No" data-node-id="425:3219">
        <div className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" data-name="Elements/Navigation Dots" data-node-id="425:3220">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3220;196:30869">
            <img alt="" className="block max-w-none size-full" src={imgShape1} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3221">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3221;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3222">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3222;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3223">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3223;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "4 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=4 Items, Switch Mobile=Yes" data-node-id="425:3232">
        <ElementsNavigationDots className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "4 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=4 Items, Switch Mobile=No" data-node-id="425:3237">
        <ElementsNavigationDots className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "5 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=5 Items, Switch Mobile=Yes" data-node-id="425:3250">
        <div className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" data-name="Elements/Navigation Dots" data-node-id="425:3251">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3251;196:30669">
            <img alt="" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3252">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3252;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3253">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3253;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3254">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3254;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3255">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3255;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "5 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=5 Items, Switch Mobile=No" data-node-id="425:3256">
        <div className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" data-name="Elements/Navigation Dots" data-node-id="425:3257">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3257;196:30669">
            <img alt="" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3258">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3258;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3259">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3259;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3260">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3260;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3261">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3261;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "5 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=5 Items, Switch Mobile=Yes" data-node-id="425:3270">
        <ElementsNavigationDots className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "5 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=5 Items, Switch Mobile=No" data-node-id="425:3276">
        <ElementsNavigationDots className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "6 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=6 Items, Switch Mobile=Yes" data-node-id="425:3290">
        <div className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" data-name="Elements/Navigation Dots" data-node-id="425:3291">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3291;196:30669">
            <img alt="" className="block max-w-none size-full" src={imgShape3} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3292">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3292;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3293">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3293;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3294">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3294;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3295">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3295;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
        <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3296">
          <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3296;0:10084">
            <img alt="" className="block max-w-none size-full" src={imgShape} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style01" && count === "6 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=6 Items, Switch Mobile=No" data-node-id="425:3297">
        <div className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" data-name="Elements/Navigation Dots" data-node-id="425:3298">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3298;196:30869">
            <img alt="" className="block max-w-none size-full" src={imgShape1} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3299">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3299;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3300">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3300;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3301">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3301;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3302">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3302;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
        <div className="relative shrink-0 size-[8px]" data-name="Elements/Navigation Dots" data-node-id="425:3303">
          <div className="absolute left-1/2 size-[8px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3303;259:108644">
            <img alt="" className="block max-w-none size-full" src={imgShape2} />
          </div>
        </div>
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "6 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=6 Items, Switch Mobile=Yes" data-node-id="425:3312">
        <ElementsNavigationDots className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style01" && count === "6 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style01, Count=6 Items, Switch Mobile=No" data-node-id="425:3319">
        <ElementsNavigationDots className="border-[#282828] border-[1.222px] border-solid relative rounded-[100px] shrink-0 size-[22px]" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "3 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=3 Items, Switch Mobile=Yes" data-node-id="425:3334">
        <ElementsNavigationDots className="h-[6px] relative shrink-0 w-[26px]" style="Active 2 Horizontal" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "3 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=3 Items, Switch Mobile=No" data-node-id="425:3338">
        <ElementsNavigationDots className="h-[8px] relative shrink-0 w-[30px]" style="Active 2 Horizontal" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "4 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=4 Items, Switch Mobile=Yes" data-node-id="425:3366">
        <ElementsNavigationDots className="h-[6px] relative shrink-0 w-[26px]" style="Active 2 Horizontal" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "4 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=4 Items, Switch Mobile=No" data-node-id="425:3371">
        <ElementsNavigationDots className="h-[8px] relative shrink-0 w-[30px]" style="Active 2 Horizontal" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "4 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=4 Items, Switch Mobile=Yes" data-node-id="425:3384">
        <ElementsNavigationDots className="h-[26px] relative shrink-0 w-[6px]" style="Active 2 Vertical" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "4 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=4 Items, Switch Mobile=No" data-node-id="425:3389">
        <ElementsNavigationDots className="h-[30px] relative shrink-0 w-[8px]" style="Active 2 Vertical" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "5 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=5 Items, Switch Mobile=Yes" data-node-id="425:3402">
        <ElementsNavigationDots className="h-[6px] relative shrink-0 w-[26px]" style="Active 2 Horizontal" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "5 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=5 Items, Switch Mobile=No" data-node-id="425:3408">
        <ElementsNavigationDots className="h-[8px] relative shrink-0 w-[30px]" style="Active 2 Horizontal" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "5 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=5 Items, Switch Mobile=Yes" data-node-id="425:3422">
        <ElementsNavigationDots className="h-[26px] relative shrink-0 w-[6px]" style="Active 2 Vertical" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "5 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=5 Items, Switch Mobile=No" data-node-id="425:3428">
        <ElementsNavigationDots className="h-[30px] relative shrink-0 w-[8px]" style="Active 2 Vertical" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "6 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=6 Items, Switch Mobile=Yes" data-node-id="425:3442">
        <ElementsNavigationDots className="h-[6px] relative shrink-0 w-[26px]" style="Active 2 Horizontal" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Horizontal" && style === "Style05" && count === "6 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Horizontal,  Style=Style05, Count=6 Items, Switch Mobile=No" data-node-id="425:3449">
        <ElementsNavigationDots className="h-[8px] relative shrink-0 w-[30px]" style="Active 2 Horizontal" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "6 Items" && switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=6 Items, Switch Mobile=Yes" data-node-id="425:3464">
        <ElementsNavigationDots className="h-[26px] relative shrink-0 w-[6px]" style="Active 2 Vertical" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
        <ElementsNavigationDots className="relative shrink-0 size-[6px]" style="Inactive" />
      </div>
    );
  }
  if (orientation === "Vertical" && style === "Style05" && count === "6 Items" && !switchMobile) {
    return (
      <div className={className} data-name="Orientation=Vertical,  Style=Style05, Count=6 Items, Switch Mobile=No" data-node-id="425:3471">
        <ElementsNavigationDots className="h-[30px] relative shrink-0 w-[8px]" style="Active 2 Vertical" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
        <ElementsNavigationDots className="relative shrink-0 size-[8px]" style="Inactive" switchMobile={false} />
      </div>
    );
  }
  return (
    <div className={className} data-name="Orientation=Horizontal,  Style=Style01, Count=3 Items, Switch Mobile=Yes" data-node-id="425:3150">
      <div className="border border-[#282828] border-solid relative rounded-[100px] shrink-0 size-[16px]" data-name="Elements/Navigation Dots" data-node-id="425:3151">
        <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3151;196:30669">
          <img alt="" className="block max-w-none size-full" src={imgShape3} />
        </div>
      </div>
      <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3152">
        <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3152;0:10084">
          <img alt="" className="block max-w-none size-full" src={imgShape} />
        </div>
      </div>
      <div className="relative shrink-0 size-[6px]" data-name="Elements/Navigation Dots" data-node-id="425:3153">
        <div className="absolute left-1/2 size-[6px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Shape" data-node-id="I425:3153;0:10084">
          <img alt="" className="block max-w-none size-full" src={imgShape} />
        </div>
      </div>
    </div>
  );
}
type SectionTitleProps = {
  className?: string;
  style?: "Style 01" | "Style 02" | "Style 03" | "Style 04";
  switchMobile?: boolean;
};

function SectionTitle({ className, style = "Style 01", switchMobile = false }: SectionTitleProps) {
  if (style === "Style 02" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Style 02, Switch Mobile=No" data-node-id="425:3491">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[40px] not-italic relative shrink-0 text-[#282828] text-[34px] tracking-[-1px] w-[766px]" data-node-id="425:3492">
          Section Title
        </p>
        <div className="border-[#282828] border-[0px_0px_1px] border-solid box-border content-stretch flex gap-[4px] items-center justify-end relative shrink-0" data-name="Button" data-node-id="425:3493">
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Container" data-node-id="I425:3493;195:30129">
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[#282828] text-[18px] text-nowrap tracking-[-0.2px] whitespace-pre" data-node-id="I425:3493;2:30788">
              See all products
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (style === "Style 04" && !switchMobile) {
    return (
      <div className={className} data-name="Style=Style 04, Switch Mobile=No" data-node-id="425:3503">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[40px] not-italic relative shrink-0 text-[#282828] text-[34px] tracking-[-1px] w-[766px]" data-node-id="425:3504">
          Section Title
        </p>
      </div>
    );
  }
  return (
    <div className={className} data-name="Style=Style 01, Switch Mobile=No" data-node-id="425:3487">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[40px] not-italic relative shrink-0 text-[#282828] text-[34px] text-center tracking-[-1px] w-[652px]" data-node-id="425:3488">
        Section Title
      </p>
    </div>
  );
}

export default function Homepage() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full" data-name="Homepage" data-node-id="425:4344">
      <div className="content-stretch flex flex-col gap-[32px] h-[918px] items-center overflow-clip relative shrink-0 w-full" data-name="Header" data-node-id="425:4345">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={styleStyle02SwitchMobileNo} />
          <div className="absolute bg-[rgba(106,104,176,0.3)] inset-0" />
        </div>
        <div className="bg-[#9dffb9] border-0 border-[rgba(255,255,255,0)] border-solid box-border content-stretch flex items-center justify-between px-[80px] py-[32px] relative shrink-0 w-full" data-name="NavBar" data-node-id="I425:4345;2538:119788">
          <div className="basis-0 grow h-[30px] min-h-px min-w-px relative shrink-0" data-name="Content" data-node-id="I425:4345;2538:119788;2415:336472">
            <Branding className="absolute left-0 size-[30px] top-0" dark={false} type="Icon 03" />
            <div className="absolute h-[19px] right-0 top-1/2 translate-y-[-50%] w-[91px]" data-name="Union" data-node-id="I425:4345;2538:119788;1511:274242">
              <img alt="" className="block max-w-none size-full" src={img17} />
            </div>
          </div>
        </div>
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start pb-0 pt-[64px] px-0 relative shrink-0 w-[1280px]" data-name="Content" data-node-id="I425:4345;2538:119789">
          <div className="h-[239px] relative shrink-0 w-[865.998px]" data-name="Logo" data-node-id="I425:4345;2538:119790">
            <img alt="" className="block max-w-none size-full" src={img18} />
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[46px] not-italic relative shrink-0 text-[42px] text-white tracking-[-2px] w-[654px]" data-node-id="I425:4345;2538:119796">{`An award winning creative agency — Based in Netherlands `}</p>
        </div>
      </div>
      <div className="bg-white box-border content-stretch flex flex-col gap-[8px] items-center justify-center overflow-clip px-[259px] py-[112px] relative shrink-0 w-full" data-name="Content" data-node-id="425:4346">
        <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-[842px]" data-name="Content" data-node-id="I425:4346;2538:154256">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[89px] not-italic relative shrink-0 text-[#282828] text-[84px] text-center tracking-[-3.5px] w-full" data-node-id="I425:4346;2538:154257">
            Creative ideas from the best minds.
          </p>
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Image" data-node-id="I425:4346;2538:154258">
            <div className="h-[448px] relative rounded-[60px] shrink-0 w-[810px]" data-name="Image" data-node-id="I425:4346;2538:154259">
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[60px]">
                <img alt="" className="absolute max-w-none object-50%-50% object-cover rounded-[60px] size-full" src={content2} />
                <img alt="" className="absolute max-w-none object-50%-50% object-cover rounded-[60px] size-full" src={img20} />
              </div>
            </div>
            <div className="absolute flex h-[290.268px] items-center justify-center left-[calc(50%+0.1px)] top-[calc(50%+0.24px)] translate-x-[-50%] translate-y-[-50%] w-[922.201px]" style={{ "--transform-inner-width": "917.390625", "--transform-inner-height": "114.53125" } as React.CSSProperties}>
              <div className="flex-none rotate-[348.819deg]">
                <div className="h-[114.545px] relative rounded-[80px] w-[917.403px]" data-name="Image" data-node-id="I425:4346;2538:154260">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[80px] size-full" src={image} />
                </div>
              </div>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[26px] not-italic relative shrink-0 text-[#5f6980] text-[16px] w-full" data-node-id="I425:4346;2538:154261">
            Ut nunc, dui sit sit nisl, cras velit lorem. Laoreet gravida adipiscing augue sit justo elit. Mauris bibendum mattis et diam tellus. Auctor mauris felis lobortis tempus, magna nisl, proin amet. Et diam amet aliquet nisi egestas aenean nunc. Vitae, arcu euismod turpis in tempus tincidunt mattis tellus nisl. Commodo lorem lacinia pulvinar lectus porttitor nisl. Amet quis consectetur malesuada lacus. Purus habitasse consequat venenatis egestas. Feugiat commodo sodales cursus mollis viverra dui convallis. Mi commodo tincidunt at risus nulla sed viverra. Sit non semper vehicula bibendum tristique eget sed accumsan elit.
          </p>
        </div>
      </div>
      <div className="bg-white box-border content-stretch flex flex-col gap-[8px] items-center justify-center pb-[80px] pt-0 px-0 relative shrink-0 w-full" data-name="Content" data-node-id="425:4347">
        <div className="content-stretch flex flex-col gap-[56px] items-start relative shrink-0" data-name="Content" data-node-id="I425:4347;2539:163817">
          <SectionTitle className="bg-[rgba(255,255,255,0)] border-[#eaecf0] border-[0px_0px_1px] border-solid box-border content-stretch flex gap-[10px] items-start px-0 py-[32px] relative shrink-0 w-[1280px]" style="Style 04" />
          <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-[1280px]" data-name="Menu" data-node-id="I425:4347;2539:163819">
            <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold gap-[16px] items-start not-italic relative shrink-0 text-[63px] tracking-[-2.5px] w-[547px]" data-name="Links" data-node-id="I425:4347;2539:163820">
              <p className="h-[73px] leading-[73px] relative shrink-0 text-[#282828] w-[547px]" data-node-id="I425:4347;2539:163821">
                Branding
              </p>
              <div className="flex flex-col justify-center leading-[0] min-w-full relative shrink-0 text-[#d0d5dd] w-[min-content]" data-node-id="I425:4347;2539:163822">
                <p className="leading-[73px]">{`Development `}</p>
              </div>
              <div className="flex flex-col justify-center leading-[0] min-w-full relative shrink-0 text-[#d0d5dd] w-[min-content]" data-node-id="I425:4347;2539:163823">
                <p className="leading-[73px]">3D+Motion</p>
              </div>
              <div className="flex flex-col justify-center leading-[0] min-w-full relative shrink-0 text-[#d0d5dd] w-[min-content]" data-node-id="I425:4347;2539:163824">
                <p className="leading-[73px]">Packaging</p>
              </div>
              <div className="flex flex-col justify-center leading-[0] min-w-full relative shrink-0 text-[#d0d5dd] w-[min-content]" data-node-id="I425:4347;2539:163825">
                <p className="leading-[73px]">UI/UX</p>
              </div>
              <div className="flex flex-col justify-center leading-[0] min-w-full relative shrink-0 text-[#d0d5dd] w-[min-content]" data-node-id="I425:4347;2539:163826">
                <p className="leading-[73px]">Packaging</p>
              </div>
            </div>
            <div className="basis-0 border border-[#4b4b4b] border-solid grow h-[528px] min-h-px min-w-px relative rounded-[40px] shrink-0" data-name="Image" data-node-id="I425:4347;2539:163827">
              <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[40px] size-full" src={content3} />
              <div className="content-stretch flex flex-col h-[528px] items-center justify-center overflow-clip relative rounded-[inherit] w-full">
                <div className="basis-0 border border-[#4b4b4b] border-solid grow min-h-px min-w-px relative shrink-0 w-[491px]" data-name="image 88" data-node-id="I425:4347;2539:163828">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={image88} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white box-border content-stretch flex flex-col gap-[8px] items-center justify-center px-0 py-[80px] relative shrink-0 w-full" data-name="Portfolio Grid" data-node-id="425:4348">
        <div className="content-stretch flex flex-col gap-[55px] items-center relative shrink-0 w-[1280px]" data-name="Content" data-node-id="I425:4348;2539:167319">
          <SectionTitle className="bg-[rgba(255,255,255,0)] border-[#dddddd] border-[0px_0px_1px] border-solid box-border content-stretch flex items-end justify-between px-0 py-[32px] relative shrink-0 w-full" style="Style 02" />
          <div className="content-stretch flex flex-col gap-[56px] items-start relative shrink-0 w-full" data-name="Cards" data-node-id="I425:4348;2539:167321">
            <ElementdPortfolioCard className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" />
            <ElementdPortfolioCard className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" />
            <ElementdPortfolioCard className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" />
            <ElementdPortfolioCard className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" />
          </div>
          <div className="bg-[#282828] box-border content-stretch flex gap-[8px] items-center justify-center px-[28px] py-[14px] relative rounded-[39px] shrink-0 w-full" data-name="Button" data-node-id="I425:4348;2539:167350">
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[34px] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white whitespace-pre" data-node-id="I425:4348;2539:167350;2:30608">
              All projects
            </p>
            <div className="relative shrink-0 size-[32.667px]" data-name="Icon/arrow-up-right" data-node-id="I425:4348;2539:167350;223:70154">
              <div className="absolute inset-[29.17%]" data-name="Vector" data-node-id="I425:4348;2539:167350;223:70154;525:132101">
                <div className="absolute inset-[-6.43%]" style={{ "--stroke-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                  <img alt="" className="block max-w-none size-full" src={img24} />
                </div>
              </div>
              <div className="absolute inset-[29.17%_29.17%_33.33%_33.33%]" data-name="Vector" data-node-id="I425:4348;2539:167350;223:70154;525:132102">
                <div className="absolute inset-[-7.14%]" style={{ "--stroke-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                  <img alt="" className="block max-w-none size-full" src={img25} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#f2f4f7] box-border content-stretch flex flex-col gap-[56px] items-center overflow-clip px-0 py-[88px] relative shrink-0 w-full" data-name="Logos" data-node-id="425:4349">
        <div className="content-stretch flex items-end justify-between not-italic relative shrink-0 text-[#282828] w-[1278px]" data-name="Header" data-node-id="I425:4349;2539:243553">
          <p className="basis-0 font-['Inter:Semi_Bold',sans-serif] font-semibold grow leading-[63px] min-h-px min-w-px relative shrink-0 text-[54px] tracking-[-1.5px]" data-node-id="I425:4349;2539:243554">
            Leading companies
          </p>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[30px] relative shrink-0 text-[18px] text-right w-[566px]" data-node-id="I425:4349;2539:243555">
            Bring people and projects together in any web browser to replace back-and-forth pings, email and endless revisions
          </p>
        </div>
        <div className="border border-[#4b4b4b] border-solid relative rounded-[40px] shrink-0 w-[1280px]" data-name="Content" data-node-id="I425:4349;2539:243556">
          <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-[1280px]">
            <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0" data-name="Logos" data-node-id="I425:4349;2539:243557">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Row 01" data-node-id="I425:4349;2539:243558">
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
              </div>
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Row 02" data-node-id="I425:4349;2539:243563">
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
                <ElementsLogoCard className="basis-0 bg-[#f2f4f7] border-[#4b4b4b] border-[0px_1px_1px_0px] border-solid grow h-[125px] min-h-px min-w-px relative shrink-0" mobileSwitch={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#111111] box-border content-stretch flex flex-col gap-[56px] items-center overflow-clip p-[80px] relative shrink-0 w-full" data-name="Footer" data-node-id="425:4350">
        <div className="content-stretch flex items-end justify-between relative shrink-0 w-[1280px]" data-name="Top" data-node-id="I425:4350;2539:247866">
          <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px relative shrink-0" data-name="CTA" data-node-id="I425:4350;2539:247867">
            <div className="bg-[#9dffb9] box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip px-[20px] py-[12px] relative rounded-[100px] shrink-0" data-name="Title" data-node-id="I425:4350;2539:247868">
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[#111111] text-[20px] text-nowrap whitespace-pre" data-node-id="I425:4350;2539:247869">
                Let’s make it happen
              </p>
            </div>
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[89px] not-italic relative shrink-0 text-[84px] text-center text-nowrap text-white tracking-[-3.5px] whitespace-pre" data-node-id="I425:4350;2539:247870">
              hello@altc.io
            </p>
          </div>
          <SocialIcons className="content-stretch flex gap-[24px] items-start relative shrink-0" color="Dark" />
        </div>
        <div className="border-[2px_0px_0px] border-solid border-white box-border content-stretch flex items-center justify-between px-0 py-[40px] relative shrink-0 w-[1280px]" data-name="Bottom" data-node-id="I425:4350;2539:247872">
          <Branding className="relative shrink-0 size-[30px]" dark={false} type="Icon 03" />
          <div className="content-start flex flex-wrap font-['Inter:Semi_Bold',sans-serif] font-semibold gap-[32px] items-start justify-end leading-[22px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre" data-name="Links" data-node-id="I425:4350;2539:247874">
            <p className="relative shrink-0" data-node-id="I425:4350;2539:247875">
              Home
            </p>
            <p className="relative shrink-0" data-node-id="I425:4350;2539:247876">
              Case studies
            </p>
            <p className="relative shrink-0" data-node-id="I425:4350;2539:247877">
              About
            </p>
            <p className="relative shrink-0" data-node-id="I425:4350;2539:247878">
              Contact
            </p>
            <p className="relative shrink-0" data-node-id="I425:4350;2539:247879">
              Terms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}