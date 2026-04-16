import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

// mark a route as unauthenticated
export const Public = () => SetMetadata(IS_PUBLIC, true);
