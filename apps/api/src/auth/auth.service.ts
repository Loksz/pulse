import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly tokenModel: Model<RefreshTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.exists({ email: dto.email });
    if (exists) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Credenciales invalidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales invalidas');

    return this.issueTokens(user);
  }

  async refresh(oldToken: string) {
    // find and delete in one op - prevents replay
    const record = await this.tokenModel.findOneAndDelete({ token: oldToken });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.userModel.findById(record.userId);
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user);
  }

  async logout(token: string): Promise<void> {
    await this.tokenModel.deleteOne({ token });
  }

  // - generates access + refresh tokens and persists the refresh token
  private async issueTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES_IN')!;
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN')!;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
        expiresIn: accessExpires as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: refreshExpires as never,
      }),
    ]);

    // parse expiry string (e.g. "7d") to a Date
    const expiresAt = this.parseExpiry(refreshExpires!);

    await this.tokenModel.create({
      token: refreshToken,
      userId: user._id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private parseExpiry(expiry: string): Date {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const ms: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + value * (ms[unit] ?? 1000));
  }
}
