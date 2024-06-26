import { FC } from "react";

export interface HeaderLogo {
	logoName: string;
}

const Logo: FC<HeaderLogo> = ({ logoName }: HeaderLogo) => {
	return (
		<div className="navbar-center">
			<a className="btn-ghost btn text-xl normal-case">{logoName}</a>
		</div>
	);
};

export default Logo;
